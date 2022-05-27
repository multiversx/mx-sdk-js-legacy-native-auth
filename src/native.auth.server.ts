import axios from "axios";
import { UserPublicKey, UserVerifier } from "@elrondnetwork/erdjs-walletcore/out";
import { Address, SignableMessage } from "@elrondnetwork/erdjs/out";
import { NativeAuthHostNotAcceptedError } from "./entities/errors/native.auth.host.not.accepted.error";
import { NativeAuthInvalidBlockHashError } from "./entities/errors/native.auth.invalid.block.hash.error";
import { NativeAuthInvalidSignatureError } from "./entities/errors/native.auth.invalid.signature.error";
import { NativeAuthTokenExpiredError } from "./entities/errors/native.auth.token.expired.error";
import { NativeAuthServerConfig } from "./entities/native.auth.server.config";
import { NativeAuthSignature } from "./native.auth.signature";
import { NativeAuthResult as NativeAuthValidateResult } from "./entities/native.auth.validate.result";
import { NativeAuthDecoded } from "./entities/native.auth.decoded";

export class NativeAuthServer {
  config: NativeAuthServerConfig;

  constructor(
    config?: Partial<NativeAuthServerConfig>,
  ) {
    this.config = Object.assign(new NativeAuthServerConfig(), config);
  }

  async decodeAccessToken(accessToken: string): Promise<NativeAuthDecoded> {
    const [address, body, signature] = accessToken.split('.');
    const parsedAddress = this.decode(address);
    const parsedBody = this.decode(body);
    const [host, blockHash, ttl, extraInfo] = parsedBody.split('.');
    const parsedExtraInfo = JSON.parse(this.decode(extraInfo));
    const parsedHost = this.decode(host);

    const blockTimestamp = await this.getBlockTimestamp(blockHash);
    if (!blockTimestamp) {
      throw new NativeAuthInvalidBlockHashError();
    }

    const result = new NativeAuthDecoded({
      issued: blockTimestamp,
      ttl: Number(ttl),
      address: parsedAddress,
      extraInfo: parsedExtraInfo,
      host: parsedHost,
      signature,
      blockHash,
      body: parsedBody,
    });

    // if empty object, delete extraInfo (e30 = encoded '{}')
    if (extraInfo === 'e30') {
      delete result.extraInfo;
    }

    return result;
  }

  async validate(accessToken: string): Promise<NativeAuthValidateResult> {
    const decoded = await this.decodeAccessToken(accessToken);

    if (this.config.acceptedHosts.length > 0 && !this.config.acceptedHosts.includes(decoded.host)) {
      throw new NativeAuthHostNotAcceptedError();
    }

    const currentBlockTimestamp = await this.getCurrentBlockTimestamp();

    const expires = decoded.issued + decoded.ttl;

    const isTokenExpired = expires < currentBlockTimestamp;
    if (isTokenExpired) {
      throw new NativeAuthTokenExpiredError();
    }

    const signedMessage = `${decoded.address}${decoded.body}{}`;
    const signableMessage = new SignableMessage({
      address: new Address(decoded.address),
      message: Buffer.from(signedMessage, 'utf8'),
      signature: new NativeAuthSignature(decoded.signature),
    });

    const publicKey = new UserPublicKey(
      Address.fromString(decoded.address).pubkey(),
    );

    const verifier = new UserVerifier(publicKey);
    const valid = verifier.verify(signableMessage);

    if (!valid) {
      throw new NativeAuthInvalidSignatureError();
    }

    const result = new NativeAuthValidateResult({
      issued: decoded.issued,
      expires,
      address: decoded.address,
      extraInfo: decoded.extraInfo,
      host: decoded.host,
    });

    if (!decoded.extraInfo) {
      delete result.extraInfo;
    }

    return result;
  }

  private async getCurrentBlockTimestamp(): Promise<number> {
    if (this.config.cache) {
      const timestamp = await this.config.cache.getValue<number>('block:timestamp:latest');
      if (timestamp) {
        return timestamp;
      }
    }

    const response = await axios.get(`${this.config.apiUrl}/blocks?size=1&fields=timestamp`);
    const timestamp = Number(response.data[0].timestamp);

    if (this.config.cache) {
      await this.config.cache.setValue('block:timestamp:latest', timestamp, 6);
    }

    return timestamp;
  }

  private async getBlockTimestamp(hash: string): Promise<number | undefined> {
    if (this.config.cache) {
      const timestamp = await this.config.cache.getValue<number>(`block:timestamp:${hash}`);
      if (timestamp) {
        return timestamp;
      }
    }

    try {
      const { data: timestamp } = await axios.get(`${this.config.apiUrl}/blocks/${hash}?extract=timestamp`);

      if (this.config.cache) {
        await this.config.cache.setValue<number>(`block:timestamp:${hash}`, Number(timestamp), this.config.maxExpirySeconds);
      }

      return Number(timestamp);
    } catch (error) {
      // @ts-ignore
      if (error.response?.status === 404) {
        return undefined;
      }

      throw error;
    }
  }

  private decode(str: string) {
    return Buffer.from(str, 'base64').toString('ascii');
  }
}

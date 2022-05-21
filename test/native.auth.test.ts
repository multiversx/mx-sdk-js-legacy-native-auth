import { parseUserKey, UserSigner, UserWallet } from "@elrondnetwork/erdjs-walletcore/out";
import { Address, SignableMessage } from "@elrondnetwork/erdjs/out";
import axios from "axios";
import MockAdapter, { RequestHandler } from "axios-mock-adapter";
import { NativeAuthHostNotAcceptedError } from "../src/entities/errors/native.auth.host.not.accepted.error";
import { NativeAuthInvalidBlockHashError } from "../src/entities/errors/native.auth.invalid.block.hash.error";
import { NativeAuthInvalidSignatureError } from "../src/entities/errors/native.auth.invalid.signature.error";
import { NativeAuthTokenExpiredError } from "../src/entities/errors/native.auth.token.expired.error";
import { NativeAuthClient } from "../src/native.auth.client";
import { NativeAuthServer } from "../src/native.auth.server";
import { NativeAuthSignature } from "../src/signature";

describe("Native Auth", () => {
  let mock: MockAdapter;
  const ADDRESS = 'erd13rrn3fwjds8r5260n6q3pd2qa6wqkudrhczh26d957c0edyzermshds0k8';
  const HOST = 'native-auth';
  const SIGNATURE = '50d853f2bb3c871981855764b109eec8549bd6251aebd78b042ed5c1861882a500a77440a381ce5e3fd08ad8b52a67e32e7a2df4d140680e45fe1c179d2cc106';
  const BLOCK_HASH = 'b3d07565293fd5684c97d2b96eb862d124fd698678f3f95b2515ed07178a27b4';
  const TTL = 86400;
  const TOKEN = `${HOST}.${BLOCK_HASH}.${TTL}`;
  const ACCESS_TOKEN = 'ZXJkMTNycm4zZndqZHM4cjUyNjBuNnEzcGQycWE2d3FrdWRyaGN6aDI2ZDk1N2MwZWR5emVybXNoZHMwazg.bmF0aXZlLWF1dGguYjNkMDc1NjUyOTNmZDU2ODRjOTdkMmI5NmViODYyZDEyNGZkNjk4Njc4ZjNmOTViMjUxNWVkMDcxNzhhMjdiNC44NjQwMA.50d853f2bb3c871981855764b109eec8549bd6251aebd78b042ed5c1861882a500a77440a381ce5e3fd08ad8b52a67e32e7a2df4d140680e45fe1c179d2cc106';
  const BLOCK_TIMESTAMP = 1653068466;

  const PEM_KEY = `-----BEGIN PRIVATE KEY for erd1qnk2vmuqywfqtdnkmauvpm8ls0xh00k8xeupuaf6cm6cd4rx89qqz0ppgl-----
  ODY1NmI0ZjMzYTRjOTY0MGI3MTFiY2E4NDUzODNiMDZiNjczMjAzNjk2ZjYxYjMy
  N2E5MDY3ODdlNWExODg1NjA0ZWNhNjZmODAyMzkyMDViNjc2ZGY3OGMwZWNmZjgz
  Y2Q3N2JlYzczNjc4MWU3NTNhYzZmNTg2ZDQ2NjM5NDA=
  -----END PRIVATE KEY for erd1qnk2vmuqywfqtdnkmauvpm8ls0xh00k8xeupuaf6cm6cd4rx89qqz0ppgl-----`;
  const PEM_ADDRESS = 'erd1qnk2vmuqywfqtdnkmauvpm8ls0xh00k8xeupuaf6cm6cd4rx89qqz0ppgl';

  const onLatestBlockHashGet = function (mock: MockAdapter): RequestHandler {
    return mock.onGet('https://api.elrond.com/blocks?size=1&fields=hash');
  };

  const onLatestBlockTimestampGet = function (mock: MockAdapter): RequestHandler {
    return mock.onGet('https://api.elrond.com/blocks?size=1&fields=timestamp');
  };

  const onSpecificBlockTimestampGet = function (mock: MockAdapter): RequestHandler {
    return mock.onGet(`https://api.elrond.com/blocks/${BLOCK_HASH}?extract=timestamp`);
  };

  beforeAll(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  describe("Client", () => {
    it("Latest block should return signable token", async () => {
      const client = new NativeAuthClient({
        host: HOST,
      });

      onLatestBlockHashGet(mock).reply(200, [{ hash: BLOCK_HASH }]);

      const token = await client.initialize();

      expect(token).toStrictEqual(`${HOST}.${BLOCK_HASH}.${TTL}`);
    });

    it("Internal server error", async () => {
      const client = new NativeAuthClient();

      onLatestBlockHashGet(mock).reply(500);

      await expect(client.initialize()).rejects.toThrow();
    });

    it('Generate Access token', () => {
      const client = new NativeAuthClient();

      const accessToken = client.getAccessToken(
        ADDRESS,
        TOKEN,
        SIGNATURE
      );

      expect(accessToken).toStrictEqual(ACCESS_TOKEN);
    });
  });

  describe('Server', () => {
    it('Latest block should return signable token', async () => {
      const server = new NativeAuthServer();

      onSpecificBlockTimestampGet(mock).reply(200, BLOCK_TIMESTAMP);
      onLatestBlockTimestampGet(mock).reply(200, [{ timestamp: BLOCK_TIMESTAMP }]);

      const result = await server.validate(ACCESS_TOKEN);

      expect(result).toStrictEqual({
        address: ADDRESS,
        issued: BLOCK_TIMESTAMP,
        expires: BLOCK_TIMESTAMP + TTL,
      });
    });

    it('Latest block + ttl should return signable token', async () => {
      const server = new NativeAuthServer();

      onSpecificBlockTimestampGet(mock).reply(200, BLOCK_TIMESTAMP);
      onLatestBlockTimestampGet(mock).reply(200, [{ timestamp: BLOCK_TIMESTAMP + TTL }]);

      const result = await server.validate(ACCESS_TOKEN);

      expect(result).toStrictEqual({
        address: ADDRESS,
        issued: BLOCK_TIMESTAMP,
        expires: BLOCK_TIMESTAMP + TTL,
      });
    });

    it('Host should be accepted', async () => {
      const server = new NativeAuthServer({
        acceptedHosts: [HOST],
      });

      onSpecificBlockTimestampGet(mock).reply(200, BLOCK_TIMESTAMP);
      onLatestBlockTimestampGet(mock).reply(200, [{ timestamp: BLOCK_TIMESTAMP }]);

      const result = await server.validate(ACCESS_TOKEN);

      expect(result).toStrictEqual({
        address: ADDRESS,
        issued: BLOCK_TIMESTAMP,
        expires: BLOCK_TIMESTAMP + TTL,
      });
    });

    it('Unsupported host should not be accepted', async () => {
      const server = new NativeAuthServer({
        acceptedHosts: ['other-host'],
      });

      onSpecificBlockTimestampGet(mock).reply(200, BLOCK_TIMESTAMP);
      onLatestBlockTimestampGet(mock).reply(200, [{ timestamp: BLOCK_TIMESTAMP }]);

      await expect(server.validate(ACCESS_TOKEN)).rejects.toThrow(NativeAuthHostNotAcceptedError);
    });

    it('Block hash not found should not be accepted', async () => {
      const server = new NativeAuthServer();

      onSpecificBlockTimestampGet(mock).reply(404);

      await expect(server.validate(ACCESS_TOKEN)).rejects.toThrow(NativeAuthInvalidBlockHashError);
    });

    it('Block hash unexpected error should throw', async () => {
      const server = new NativeAuthServer();

      onSpecificBlockTimestampGet(mock).reply(500);

      await expect(server.validate(ACCESS_TOKEN)).rejects.toThrow('Request failed with status code 500');
    });

    it('Latest block + ttl + 1 should throw expired error', async () => {
      const server = new NativeAuthServer();

      onSpecificBlockTimestampGet(mock).reply(200, BLOCK_TIMESTAMP);
      onLatestBlockTimestampGet(mock).reply(200, [{ timestamp: BLOCK_TIMESTAMP + TTL + 1 }]);

      await expect(server.validate(ACCESS_TOKEN)).rejects.toThrow(NativeAuthTokenExpiredError);
    });

    it('Invalid signature should throw error', async () => {
      const server = new NativeAuthServer();

      onSpecificBlockTimestampGet(mock).reply(200, BLOCK_TIMESTAMP);
      onLatestBlockTimestampGet(mock).reply(200, [{ timestamp: BLOCK_TIMESTAMP }]);

      await expect(server.validate(ACCESS_TOKEN + 'abbbbbbbbb')).rejects.toThrow(NativeAuthInvalidSignatureError);
    });
  });

  describe('Client & Server', () => {
    it('End-to-end with internal pem', async () => {
      const client = new NativeAuthClient();

      onLatestBlockHashGet(mock).reply(200, [{ hash: BLOCK_HASH }]);

      const pem = UserSigner.fromPem(PEM_KEY);

      const signableToken = await client.initialize();

      const messageToSign = `${PEM_ADDRESS}${signableToken}{}`;
      const signableMessage = new SignableMessage({
        message: Buffer.from(messageToSign, 'utf8'),
      });
      await pem.sign(signableMessage);

      const signature = signableMessage.getSignature();

      const accessToken = client.getAccessToken(PEM_ADDRESS, signableToken, signature.hex());

      const server = new NativeAuthServer();

      onSpecificBlockTimestampGet(mock).reply(200, BLOCK_TIMESTAMP);
      onLatestBlockTimestampGet(mock).reply(200, [{ timestamp: BLOCK_TIMESTAMP }]);

      const result = await server.validate(accessToken);

      expect(result).toStrictEqual({
        address: PEM_ADDRESS,
        issued: BLOCK_TIMESTAMP,
        expires: BLOCK_TIMESTAMP + TTL,
      });
    });
  });
});

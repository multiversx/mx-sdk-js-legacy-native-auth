import axios from "axios";
import { NativeAuthClientConfig } from "./entities/native.auth.client.config";

export class NativeAuthClient {
  private readonly config: NativeAuthClientConfig;

  constructor(config?: Partial<NativeAuthClientConfig>) {
    this.config = Object.assign(new NativeAuthClientConfig(), config);
  }

  getToken(address: string, token: string, signature: string): string {
    const encodedAddress = this.encodeValue(address);
    const encodedToken = this.encodeValue(token);

    const accessToken = `${encodedAddress}.${encodedToken}.${signature}`;
    return accessToken;
  }

  async initialize(extraInfo: any = {}): Promise<string> {
    const blockHash = await this.getCurrentBlockHash();
    const encodedExtraInfo = this.encodeValue(JSON.stringify(extraInfo));
    const host = this.encodeValue(this.config.host);

    return `${host}.${blockHash}.${this.config.expirySeconds}.${encodedExtraInfo}`;
  }

  private async getCurrentBlockHash(): Promise<string | undefined> {
    const response = await axios.get(`${this.config.apiUrl}/blocks?size=1&fields=hash`);
    return response.data[0].hash;
  }

  private encodeValue(str: string) {
    return this.escape(Buffer.from(str, "utf8").toString("base64"));
  }

  private escape(str: string) {
    return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }
}

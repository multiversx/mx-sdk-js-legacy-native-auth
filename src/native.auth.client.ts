import axios from "axios";
import { NativeAuthClientConfig } from "./entities/native.auth.client.config";

export class NativeAuthClient {
  private readonly config: NativeAuthClientConfig;

  constructor(config?: Partial<NativeAuthClientConfig>) {
    this.config = Object.assign(new NativeAuthClientConfig(), config);
  }

  getAccessToken(address: string, token: string, signature: string): string {
    const encodedAddress = this.encode(address);
    const encodedToken = this.encode(token);

    const accessToken = `${encodedAddress}.${encodedToken}.${signature}`;
    return accessToken;
  }

  async getSignableToken(): Promise<string> {
    const blockHash = await this.getCurrentBlockHash();

    return `${this.config.host}.${blockHash}.${this.config.expirySeconds}`;
  }

  private async getCurrentBlockHash(): Promise<string | undefined> {
    const response = await axios.get(`${this.config.apiUrl}/blocks?size=1&fields=hash`);
    return response.data[0].hash;
  }

  private encode(str: string) {
    return this.escape(Buffer.from(str, "utf8").toString("base64"));
  }

  private escape(str: string) {
    return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }
}

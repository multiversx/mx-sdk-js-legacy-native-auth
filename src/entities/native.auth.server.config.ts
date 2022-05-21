import { NativeAuthCacheInterface } from "../native.auth.cache.interface";

export class NativeAuthServerConfig {
  apiUrl: string = 'https://api.elrond.com';
  acceptedHosts: string[] = [];
  maxExpirySeconds: number = 0;
  cache?: NativeAuthCacheInterface;
}

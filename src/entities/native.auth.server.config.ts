import { NativeAuthCacheInterface } from "../native.auth.cache.interface";

export class NativeAuthServerConfig {
  apiUrl: string = 'https://api.elrond.com';
  acceptedHosts: string[] = [];
  maxExpirySeconds: number = 86400;
  cache?: NativeAuthCacheInterface;
}

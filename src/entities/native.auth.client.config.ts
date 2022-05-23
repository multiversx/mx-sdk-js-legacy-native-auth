export class NativeAuthClientConfig {
  host: string = typeof window !== "undefined" ? window.location.hostname : '';
  apiUrl: string = 'https://api.elrond.com';
  expirySeconds: number = 60 * 60 * 24;
}

export class NativeAuthClientConfig {
  host: string = typeof window !== "undefined" ? new URL(window.location.host).hostname : '';
  apiUrl: string = 'https://api.elrond.com';
  expirySeconds: number = 60 * 60 * 24;
}

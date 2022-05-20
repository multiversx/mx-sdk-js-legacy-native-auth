export class NativeAuthTokenExpiredError extends Error {
  constructor() {
    super('Token expired');
  }
}

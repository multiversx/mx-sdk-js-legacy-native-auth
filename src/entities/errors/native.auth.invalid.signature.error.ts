export class NativeAuthInvalidSignatureError extends Error {
  constructor() {
    super('Invalid signature');
  }
}

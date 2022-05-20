export class NativeAuthInvalidBlockHashError extends Error {
  constructor() {
    super('Invalid block hash');
  }
}

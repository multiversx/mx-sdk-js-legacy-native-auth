import { ISignature } from "@multiversx/erdjs";

export class NativeAuthSignature implements ISignature {
  constructor(private readonly signature: string) {}

  hex(): string {
    return this.signature;
  }
}

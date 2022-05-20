import { ISignature } from "@elrondnetwork/erdjs/out";

export class NativeAuthSignature implements ISignature {
  constructor(private readonly signature: string) { }

  hex(): string {
    return this.signature;
  }
}

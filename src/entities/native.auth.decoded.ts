export class NativeAuthDecoded {
  constructor(result?: Partial<NativeAuthDecoded>) {
    Object.assign(this, result);
  }

  ttl: number = 0;
  address: string = '';
  host: string = '';
  extraInfo?: any;
  signature: string = '';
  blockHash: string = '';
  body: string = '';
}

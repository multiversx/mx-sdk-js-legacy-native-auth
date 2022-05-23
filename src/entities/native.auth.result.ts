export class NativeAuthResult {
  constructor(result?: Partial<NativeAuthResult>) {
    Object.assign(this, result);
  }

  issued: number = 0;
  expires: number = 0;
  address: string = '';
  extraInfo?: any;
}

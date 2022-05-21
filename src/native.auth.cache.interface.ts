export interface NativeAuthCacheInterface {
  getValue<T>(key: string): Promise<T | undefined>

  setValue<T>(key: string, value: T, ttl: number): Promise<void>
}

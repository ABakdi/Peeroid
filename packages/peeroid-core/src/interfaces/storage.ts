export interface IPeeroidStorage {
  get(key: string): Promise<Uint8Array | null>;
  set(key: string, value: Uint8Array): Promise<void>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  list(prefix?: string): Promise<string[]>;
  clear(): Promise<void>;
}

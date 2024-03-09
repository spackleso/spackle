export type Entry<TValue> = {
  value: TValue
  maxFresh: number
  maxStale: number
}

export interface Cache {
  get(namespace: string, key: string): Promise<[unknown | undefined, boolean]>
  set(namespace: string, key: string, value: any): Promise<void>
  remove(namespace: string, key: string): Promise<void>
}

export type ExtendedKeyScope = {
  type: string
  name: string
  generation: number
  keyType: string
}

export interface StorableKey {
  scope: ExtendedKeyScope
  key: string
  teamId: string
}

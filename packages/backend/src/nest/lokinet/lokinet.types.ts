export interface LokinetParamsProvider {
  lokinetPath?: string
  extraArgs?: Record<string, string>
}

export interface SpawnSnappParams {
  targetPort: number
  privKey?: string
  keyfile?: string
}

export interface SnappData {
  address: string
  targetPort: number
  keyfile?: string
}

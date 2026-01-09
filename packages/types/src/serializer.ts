import type { Options } from 'msgpackr'

export enum SerializerEncodingType {
  BUFFER = 'buffer',
  UINT8ARRAY = 'uint8array',
}

export type PackrStreamOptions = Options | { highWaterMark: number; emitClose: boolean; allowHalfOpen: boolean }

export interface SerializerConfig {
  packer?: Options
}

export const DEFAULT_PACKER_CONFIG: Options = {
  moreTypes: true,
  copyBuffers: true,
}

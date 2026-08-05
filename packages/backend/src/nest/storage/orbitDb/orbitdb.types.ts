import { LogEntry } from '@orbitdb/core'

export interface LogUpdate {
  id: string
  teamId: string
  addr: string
  hash: string
  entry: LogEntry
}

export enum OrbitDbOp {
  PUT = 'PUT',
  DEL = 'DEL',
}

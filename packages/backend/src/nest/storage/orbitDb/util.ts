/**
 * Forked from: https://github.com/orbitdb/orbitdb/blob/9ddffd346a26937902cacf0a33ee8210bdc637a0/src/utils/path-join.js
 */

import { LogEntry } from '@orbitdb/core'
import { LogUpdate } from './orbitdb.types'

export const posixJoin = (...paths: string[]) =>
  paths.join('/').replace(/((?<=\/)\/+)|(^\.\/)|((?<=\/)\.\/)/g, '') || '.'

export const logEntryToLogUpdate = (entry: LogEntry, address: string, teamId?: string): LogUpdate => ({
  id: entry.id,
  teamId: (entry.payload.value as any)?.teamId ?? teamId,
  addr: address,
  hash: entry.hash,
  entry,
})

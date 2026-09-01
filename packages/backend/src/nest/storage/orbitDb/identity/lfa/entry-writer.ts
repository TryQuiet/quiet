import { type IdentitiesType, type LogEntry } from '@orbitdb/core'
import { createLogger } from '../../../../common/logger'
import { LFAIdentity } from './types'

const logger = createLogger('orbitdb:identity:lfa:entry-writer')

/**
 * Resolve and verify the writer of an OrbitDB entry.
 *
 * OrbitDB carries the writer identity (`entry.identity`) and the signing key (`entry.key`) as two
 * separate fields and verifies the entry signature against `entry.key` alone, so an entry can claim
 * one identity while being signed by another. This is the single place that binds the two: the
 * identity the entry names must declare exactly the key the entry was signed with, and that identity
 * must verify against the sigchain. Every consumer that authorizes anything by writer ID must go
 * through here rather than calling `getIdentity` directly.
 *
 * @returns The verified writer identity, or undefined if the entry's writer cannot be trusted
 */
export const getVerifiedEntryWriter = async (
  identities: IdentitiesType,
  entry: Pick<LogEntry, 'identity' | 'key' | 'hash'>
): Promise<LFAIdentity | undefined> => {
  let writer: LFAIdentity | undefined
  try {
    writer = (await identities.getIdentity(entry.identity)) as unknown as LFAIdentity | undefined
  } catch (e) {
    logger.warn(`Could not resolve the writer identity of entry ${entry.hash}`, e)
    return undefined
  }
  if (writer == null) {
    return undefined
  }
  if (writer.publicKey !== entry.key) {
    logger.warn(`Entry ${entry.hash} was signed with a key other than the one its identity declares`)
    return undefined
  }
  if (!(await identities.verifyIdentity(writer as any))) {
    return undefined
  }
  return writer
}

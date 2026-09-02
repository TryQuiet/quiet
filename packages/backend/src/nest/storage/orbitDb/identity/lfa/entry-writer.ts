import { Entry, type IdentitiesType, type LogEntry } from '@orbitdb/core'
import { createLogger } from '../../../../common/logger'
import { LFAIdentity } from './types'

const logger = createLogger('orbitdb:identity:lfa:entry-writer')

/**
 * Resolve and authenticate the writer of an OrbitDB entry.
 *
 * OrbitDB carries the writer identity (`entry.identity`), the signing key (`entry.key`) and the
 * signature (`entry.sig`) as three separate fields, and the signature covers none of the first two.
 * An entry can therefore claim one identity, be attributed to a second key and be signed by a third
 * party. This is the single place that ties all three together. A returned writer means all of:
 *
 *   - the signature is valid over the entry's canonical bytes under `entry.key`;
 *   - `entry.key` is the registered signing key of the device the identity names;
 *   - that device belongs to the user the identity claims;
 *   - that user is a current member of the team.
 *
 * The returned principal is therefore authenticated, not merely claimed, so a caller may authorize
 * on `writer.id` with nothing further. In particular an access controller's `canAppend` rejects
 * every signer substitution on its own, without relying on any later check.
 *
 * OrbitDB's own join path verifies the signature a second time (`Log.joinEntry` runs `canAppend` and
 * then `Entry.verify`). That duplication is deliberate: it keeps this function's guarantee true for
 * every caller, including the store validators that never go through `Log.joinEntry`, rather than
 * leaving one layer's correctness contingent on another's.
 *
 * Every consumer that authorizes anything by writer ID must go through here rather than calling
 * `getIdentity` directly.
 *
 * @returns The authenticated writer identity, or undefined if the entry's writer cannot be trusted
 */
export const getVerifiedEntryWriter = async (
  identities: IdentitiesType,
  entry: LogEntry
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
  // The identity and the key agree with the chain at this point, but nothing yet says the holder of
  // that key produced this entry. Without this, an entry signed by one member and relabelled with
  // another member's identity and key still resolves to that other member.
  let signatureIsValid: boolean
  try {
    signatureIsValid = await Entry.verify(identities, entry)
  } catch (e) {
    logger.warn(`Could not verify the signature of entry ${entry.hash}`, e)
    return undefined
  }
  if (!signatureIsValid) {
    logger.warn(`Entry ${entry.hash} was not signed by the device its identity names`)
    return undefined
  }
  return writer
}

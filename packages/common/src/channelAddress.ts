import crypto from 'crypto'

// A channel id binds its creator's owner id into the id itself via a commitment, so that ownership
// can be validated statelessly (without consulting prior store state). The id has the shape:
//
//   `${name}_${nonce}_${commitment}`  where  commitment = sha256(`${ownerId}:${nonce}`)
//
// `nonce` is 16 random bytes (32 hex chars) and `commitment` is a sha256 digest (64 hex chars).
// Because both trailing segments are fixed-length lowercase hex, they are unambiguous even when the
// channel name itself contains underscores. Hijacking an existing id with a different owner would
// require a sha256 second-preimage, so it is infeasible.
const NONCE_HEX_LENGTH = 32
const COMMITMENT_HEX_LENGTH = 64
const BOUND_CHANNEL_ID_REGEX = new RegExp(`^(.*)_([0-9a-f]{${NONCE_HEX_LENGTH}})_([0-9a-f]{${COMMITMENT_HEX_LENGTH}})$`)

const channelOwnerCommitment = (ownerId: string, nonce: string): string =>
  crypto.createHash('sha256').update(`${ownerId}:${nonce}`).digest('hex')

/**
 * Generate a channel id. When `ownerId` is provided the id is bound to that owner so ownership can
 * be validated statelessly (see `verifyChannelIdOwner`). When omitted, a legacy/unbound id is
 * produced for backwards compatibility (and test fixtures). Production callers must always pass
 * `ownerId`; the backend additionally rejects unbound ids at channel-creation time.
 */
export const generateChannelId = (channelName: string, ownerId?: string): string => {
  const nonce = crypto.randomBytes(NONCE_HEX_LENGTH / 2).toString('hex')
  if (ownerId == null) {
    return `${channelName}_${nonce}`
  }
  const commitment = channelOwnerCommitment(ownerId, nonce)
  return `${channelName}_${nonce}_${commitment}`
}

export interface ParsedBoundChannelId {
  name: string
  nonce: string
  commitment: string
}

export const parseBoundChannelId = (channelId: string): ParsedBoundChannelId | null => {
  const match = BOUND_CHANNEL_ID_REGEX.exec(channelId)
  if (match == null) {
    return null
  }
  return { name: match[1], nonce: match[2], commitment: match[3] }
}

/**
 * True for ids generated with owner binding (post-migration). Legacy ids (`name_<random>`) return
 * false and must be validated via the stateful fallback.
 */
export const isBoundChannelId = (channelId: string): boolean => BOUND_CHANNEL_ID_REGEX.test(channelId)

/**
 * Verify that a bound channel id commits to the given owner. Returns false for legacy/unbound ids.
 */
export const verifyChannelIdOwner = (channelId: string, ownerId: string): boolean => {
  const parsed = parseBoundChannelId(channelId)
  if (parsed == null) {
    return false
  }
  return parsed.commitment === channelOwnerCommitment(ownerId, parsed.nonce)
}

export const getChannelNameFromChannelId = (channelId: string) => {
  const bound = parseBoundChannelId(channelId)
  if (bound != null) {
    return bound.name
  }
  const index = channelId.indexOf('_')
  if (index === -1) {
    return channelId
  } else {
    return channelId.substring(0, index)
  }
}

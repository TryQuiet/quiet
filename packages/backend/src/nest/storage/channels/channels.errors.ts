export class NotAMemberError extends Error {
  constructor(id?: string) {
    super(`Not a member of this channel: ${id}`)
  }
}

/**
 * Thrown when a channel entry is addressed to a role we do belong to but still can't be
 * decrypted, which in practice means the role's key hasn't reached this device yet.
 *
 * Kept distinct from a generic decrypt failure so that both "no membership" and "no key"
 * are handled as one retryable state: the entry is left unindexed and revisited, rather
 * than being written off as permanently invalid.
 */
export class MissingChannelKeyError extends Error {
  constructor(
    id?: string,
    public readonly originalError?: unknown
  ) {
    super(`Missing key for this channel: ${id}`)
  }
}

/**
 * Whether a channel entry failed in a way that a later attempt could plausibly fix —
 * membership or key material that hasn't arrived yet — as opposed to an entry that is
 * simply invalid.
 */
export const isChannelEntryDecryptPending = (err: unknown): boolean =>
  err instanceof NotAMemberError ||
  err instanceof MissingChannelKeyError ||
  (err instanceof Error && err.message.startsWith('Not a member of this channel'))

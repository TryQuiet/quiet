import { getInvitationCodes } from '@quiet/state-manager'
import { type InvitationData, isDeviceInvitationData } from '@quiet/types'

import { createLogger } from '../logger'
import { InviteLinkErrors } from './fieldsErrors'

const logger = createLogger('forms:inviteLink')

/** What a field accepts: any invitation, or only a device link (the Link devices flow). */
export type InviteLinkKind = 'any' | 'device'

export type InviteLinkValidation =
  { data: InvitationData; error?: undefined } | { data?: undefined; error: InviteLinkErrors }

/**
 * The invite field's validation, in one place.
 *
 * This is the rule the pre-redesign Join community form carried inline
 * (`PerformCommunityActionComponent`, the `CommunityOwnership.User` branch): parse the
 * trimmed value with the shared invitation parser and, when it yields nothing, report
 * `InviteLinkErrors.InvalidCode` on the field. That screen is gone; the rule is not, and
 * every surface that takes an invite link calls this rather than repeating it — the paste
 * step, the QR scanner, and both of the Link devices variants.
 *
 * `kind: 'device'` adds the Link devices narrowing (user addition, 2026-09-13): a member
 * link parses, but is not what that flow can act on.
 */
export const validateInviteLink = (value: string, kind: InviteLinkKind = 'any'): InviteLinkValidation => {
  let data: InvitationData | undefined
  try {
    data = getInvitationCodes(value.trim()) ?? undefined
  } catch (e) {
    logger.error('Could not parse invitation code', e)
  }

  if (!data) return { error: InviteLinkErrors.InvalidCode }
  if (kind === 'device' && !isDeviceInvitationData(data)) return { error: InviteLinkErrors.NotDeviceLink }
  return { data }
}

/**
 * The same validation where there is no field to report on — a camera frame. Null when the
 * text is not a Quiet invitation, which is what the scanner needs to keep scanning.
 */
export const parseInviteLink = (text: string): InvitationData | null => validateInviteLink(text).data ?? null

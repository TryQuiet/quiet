import { getInvitationCodes } from '@quiet/state-manager'
import { type InvitationData, isDeviceInvitationData } from '@quiet/types'

import type { PasteInviteLinkVariant } from '../route.params'
import { createLogger } from './logger'

const logger = createLogger('inviteLink')

/** Shown when Continue is pressed with nothing in the field. */
export const EMPTY_INVITATION_ERROR = 'Community address can not be empty'

/** The paste field's error for text that is not a Quiet invitation; the QR scanner shows the same. */
export const INVALID_INVITATION_ERROR = 'Please check your invite link and try again'

/** Shown for a member link (or any other invitation) in the Link devices flow. Undesigned copy. */
export const NOT_A_DEVICE_LINK_ERROR = 'This is not a device link. Use the link from Link devices on your other device.'

/** The Link devices flow's variants: only a device link is accepted there. */
export const DEVICE_LINK_VARIANTS: PasteInviteLinkVariant[] = ['deviceLink', 'pasteDeviceLink']

export type InviteLinkValidation = { data: InvitationData; error?: undefined } | { data?: undefined; error: string }

/**
 * The invite field's validation, in one place.
 *
 * This is the rule the pre-redesign Join community screen carried inline: reject an empty
 * field, then parse the trimmed value with the shared invitation parser and, when it yields
 * nothing, report it on the field. That screen is gone; the rule is not, and every surface
 * that takes an invite link calls this rather than repeating it — the paste step, the QR
 * scanner sheet, and both Link devices variants.
 *
 * The `deviceLink` variants add the Link devices narrowing (user addition, 2026-09-13): a
 * member link parses, but is not what that flow can act on.
 */
export const validateInviteLink = (
  value: string | undefined,
  variant: PasteInviteLinkVariant = 'inviteLink'
): InviteLinkValidation => {
  if (value === undefined || value.length === 0) return { error: EMPTY_INVITATION_ERROR }

  let data: InvitationData | null = null
  try {
    data = getInvitationCodes(value.trim())
  } catch (e) {
    logger.error('Could not parse invitation code', e)
  }

  if (!data) return { error: INVALID_INVITATION_ERROR }
  if (DEVICE_LINK_VARIANTS.includes(variant) && !isDeviceInvitationData(data)) {
    return { error: NOT_A_DEVICE_LINK_ERROR }
  }
  return { data }
}

/**
 * The same validation where there is no field to report on — a camera frame. Null when the
 * text is not a Quiet invitation, which is what the scanner needs to keep scanning.
 */
export const parseInviteLink = (text: string): InvitationData | null => validateInviteLink(text).data ?? null

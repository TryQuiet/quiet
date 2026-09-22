import { getInvitationCodes } from '@quiet/state-manager'
import type { InvitationData } from '@quiet/types'

/**
 * A scanned code goes through the parser the paste field uses, so a QR code is
 * exactly a pasted link. Null when the text is not a Quiet invitation (member or
 * device). Mirrors desktop's qrScanner/decodeQr.ts.
 */
export const parseScannedCode = (text: string): InvitationData | null => {
  try {
    return getInvitationCodes(text.trim()) ?? null
  } catch {
    return null
  }
}

import jsQR from 'jsqr'
import { getInvitationCodes } from '@quiet/state-manager'
import type { InvitationData } from '@quiet/types'

/** Text of the QR code in a camera frame, or null when there is none. */
export const decodeQrImage = (image: ImageData): string | null =>
  jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' })?.data ?? null

/**
 * A scanned code goes through the parser the paste field uses, so a QR code is exactly a
 * pasted link. Null when the text is not a Quiet invitation (member or device).
 */
export const parseScannedCode = (text: string): InvitationData | null => {
  try {
    return getInvitationCodes(text.trim()) ?? null
  } catch {
    return null
  }
}

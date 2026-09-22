import jsQR from 'jsqr'

/** Text of the QR code in a camera frame, or null when there is none. */
export const decodeQrImage = (image: ImageData): string | null =>
  jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' })?.data ?? null

/**
 * A scanned code goes through the invite field's own validation, so a QR code is exactly a
 * pasted link — the same rule, and the same message when it fails. Null when the text is
 * not a Quiet invitation (member or device).
 */
export { parseInviteLink as parseScannedCode } from '../../../forms/inviteLink'

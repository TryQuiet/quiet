/**
 * A scanned code goes through the invite field's own validation, so a QR code is exactly a
 * pasted link — the same rule, and the same message when it fails. Null when the text is
 * not a Quiet invitation (member or device). Mirrors desktop's qrScanner/decodeQr.ts.
 */
export { parseInviteLink as parseScannedCode } from '../../utils/inviteLink'

import type { LinkedDevice } from '@quiet/types'

/**
 * Which way this device links (user decision, 2026-09-13): inside a community it
 * shares — Display QR code and Copy link; without one it receives — Scan QR code and
 * Paste link. The rows of the other direction are not drawn.
 */
export type LinkDevicesDirection = 'share' | 'receive'

export interface LinkDevicesProps {
  direction: LinkDevicesDirection
  /** share: opens the QR code screen. */
  onDisplayQrCode?: () => void
  /** share: copies the same link the QR screen shows and confirms. */
  onCopyLink?: () => void
  /** receive: opens the camera (the paste field on this branch). */
  onScanQrCode?: () => void
  /** receive: the Paste link row (user addition, 2026-09-13; not in 2811:2575). */
  onPasteLink?: () => void
  /**
   * share: the current user's devices, as read from the backend. Only the share
   * direction has a community, and only a community has a team graph to read them
   * from. `undefined` until that read comes back, and the list is not drawn until
   * then, so the card never claims "No linked devices" before the app knows.
   */
  linkedDevices?: LinkedDevice[]
  handleBackButton?: () => void
}

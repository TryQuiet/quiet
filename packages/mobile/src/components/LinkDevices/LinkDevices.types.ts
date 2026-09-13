export interface LinkedDeviceRow {
  deviceId: string
  deviceName: string
  isCurrent: boolean
  /** Set once the device was removed from the team; such devices are not listed. */
  removedAt?: number | null
}

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
  /** share: copies the same one-time link the QR screen shows and confirms. */
  onCopyLink?: () => void
  /** receive: opens the camera (the paste field on this branch). */
  onScanQrCode?: () => void
  /** receive: the Paste link row (user addition, 2026-09-13; not in 2811:2575). */
  onPasteLink?: () => void
  linkedDevices?: LinkedDeviceRow[]
  handleBackButton?: () => void
}

export interface LinkedDeviceRow {
  deviceId: string
  deviceName: string
  isCurrent: boolean
  /** Set once the device was removed from the team; such devices are not listed. */
  removedAt?: number | null
}

export interface LinkDevicesProps {
  onDisplayQrCode: () => void
  onScanQrCode: () => void
  /** The Paste link row (user addition, 2026-09-13; not in 2811:2575). */
  onPasteLink: () => void
  /** A device link can only be minted from inside a community. */
  canDisplayQrCode?: boolean
  linkedDevices?: LinkedDeviceRow[]
  handleBackButton?: () => void
}

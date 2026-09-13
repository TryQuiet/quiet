export interface LinkedDeviceRow {
  deviceId: string
  deviceName: string
  isCurrent: boolean
}

export interface LinkDevicesProps {
  onDisplayQrCode: () => void
  onScanQrCode: () => void
  /** A device link can only be minted from inside a community. */
  canDisplayQrCode?: boolean
  linkedDevices?: LinkedDeviceRow[]
  handleBackButton?: () => void
}

export interface LinkDevicesProps {
  onDisplayQrCode: () => void
  onScanQrCode: () => void
  /** A device link can only be minted from inside a community. */
  canDisplayQrCode?: boolean
  handleBackButton?: () => void
}

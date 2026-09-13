export interface LinkedDeviceQRCodeProps {
  /** The device link; empty while it is being minted. */
  value: string
  isLoading: boolean
  /** Copy link: the caller puts the link on the clipboard and confirms. */
  onCopyLink: () => void
  /** Reset QR code: mint a new one-time link. */
  onReset: () => void
  handleBackButton: () => void
}

export interface LinkedDeviceQRCodeProps {
  /** The device link; empty while it is being minted. */
  value: string
  isLoading: boolean
  /** The backend could not mint a link; the box stays empty and says so. */
  failed?: boolean
  /** Copy link: the caller puts the link on the clipboard and confirms. */
  onCopyLink: () => void
  /** Reset QR code: invalidate the current link and mint another. */
  onReset: () => void
  handleBackButton: () => void
}

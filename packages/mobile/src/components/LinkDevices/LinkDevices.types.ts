import type { LinkedDevice } from '@quiet/types'

export interface LinkDevicesProps {
  onDisplayQrCode: () => void
  onScanQrCode: () => void
  /** A device link can only be minted from inside a community. */
  canDisplayQrCode?: boolean
  /**
   * The current user's devices, as read from the backend. Undefined outside a
   * community: there is no team graph to list devices from, so the screen shows
   * the two routes without a list rather than an empty one.
   */
  linkedDevices?: LinkedDevice[]
  handleBackButton?: () => void
}

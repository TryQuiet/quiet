import type { LinkedDevice } from '@quiet/types'

export interface LinkedDevicesComponentProps {
  deviceLink: string
  isLoading: boolean
  revealLink: boolean
  onToggleLinkVisibility: () => void
  /**
   * The current user's devices, as read from the backend. Undefined outside a
   * community: there is no team graph to list devices from, so the surface
   * shows the share direction without a list rather than an empty one.
   */
  linkedDevices?: LinkedDevice[]
  /** Inside the onboarding modal: centered heading and content, per the layout canon. */
  centered?: boolean
}

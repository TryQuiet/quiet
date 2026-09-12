import type { LinkedDevice } from '@quiet/types'

export interface LinkedDevicesComponentProps {
  deviceLink: string
  isLoading: boolean
  revealLink: boolean
  onToggleLinkVisibility: () => void
  /** The current user's devices from the team graph; this device excluded from the list. */
  linkedDevices?: LinkedDevice[]
  /** Inside the onboarding modal: centered heading and content, per the layout canon. */
  centered?: boolean
}

import type { LinkedDevice } from '@quiet/types'

export interface LinkedDevicesComponentProps {
  deviceLink: string
  isLoading: boolean
  /** Reset QR code: mint a new one-time link. */
  onReset: () => void
  /** The current user's devices from the team graph; this device excluded from the list. */
  linkedDevices?: LinkedDevice[]
}

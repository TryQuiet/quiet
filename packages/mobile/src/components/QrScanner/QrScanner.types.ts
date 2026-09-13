import type { ReactNode } from 'react'
import type { InvitationData } from '@quiet/types'

export type QrScannerStatus =
  /** Waiting for the OS permission prompt. */
  | 'requesting'
  /** The camera is on and codes are being decoded. */
  | 'scanning'
  /** The user (or the OS) refused the camera. */
  | 'denied'
  /** No back camera, or the camera cannot be opened. */
  | 'unavailable'
  /** A code was accepted and the camera released. */
  | 'stopped'

export interface QrScannerSheetProps {
  /** Title bar text: "Join with QR code" or "Scan QR code". */
  title: string
  /** Copy between the title bar and the camera (the Link devices sheet has one; Join with QR code has none). */
  intro?: string
  status: QrScannerStatus
  /** The last code was not a Quiet invitation: the paste field's error shows and scanning goes on. */
  invalid: boolean
  /** The camera preview, filling the viewfinder. */
  camera?: ReactNode
  onClose: () => void
  /** Route to the paste field when the camera cannot be used. */
  onUsePasteLink: () => void
  testID?: string
}

export interface QrScannerProps {
  title: string
  intro?: string
  /** A scanned Quiet invitation, member or device, parsed exactly as a pasted link is. Called once. */
  onDecoded: (data: InvitationData) => void
  onClose: () => void
  onUsePasteLink: () => void
  testID?: string
}

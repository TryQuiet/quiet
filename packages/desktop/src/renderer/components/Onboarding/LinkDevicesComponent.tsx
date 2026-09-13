import React from 'react'

import { ActionRow } from './ActionRow'
import { OnboardingBody, RowGroup } from './OnboardingBody'
import { LinkedDevicesList, type LinkedDeviceRow } from './LinkedDevicesList'
import { onboardingIcons } from './icons'

export type { LinkedDeviceRow } from './LinkedDevicesList'

export interface LinkDevicesComponentProps {
  onDisplayQrCode: () => void
  onScanQrCode: () => void
  /** The Paste link row (user addition, 2026-09-13; not in 2811:2575). */
  onPasteLink: () => void
  /** A device link can only be minted from inside a community; the row is disabled until there is one. */
  canDisplayQrCode?: boolean
  /** Devices linked to this user; undefined while unknown. */
  linkedDevices?: LinkedDeviceRow[]
}

/**
 * Link devices · Figma 2811:2575, in the shell of the Device-linking desktop frames
 * 879:20987 / 880:17196: the rows in the library's bordered group, then the Linked
 * devices list. Plus a third Button row, "Paste link", the user asked for on 2026-09-13:
 * the same row as the two above it, with the library's link glyph (the one Join with
 * invite link uses on 2811:2562). Its label is not the designer's.
 */
export const LinkDevicesComponent: React.FC<LinkDevicesComponentProps> = ({
  onDisplayQrCode,
  onScanQrCode,
  onPasteLink,
  canDisplayQrCode = true,
  linkedDevices,
}) => (
  <OnboardingBody
    heading={'Link devices'}
    intro={
      'Display the QR code on one device and scan it with another. Linked devices share all communities, and you will not lose access to anything.'
    }
    dataTestId='link-devices'
  >
    <RowGroup bordered dataTestId='link-devices-rows'>
      <ActionRow
        icon={onboardingIcons.qrDisplay}
        label={'Display QR code'}
        onClick={onDisplayQrCode}
        disabled={!canDisplayQrCode}
        dataTestId='link-devices-display-qr'
      />
      <ActionRow
        icon={onboardingIcons.qrScan}
        label={'Scan QR code'}
        onClick={onScanQrCode}
        dataTestId='link-devices-scan-qr'
      />
      <ActionRow
        icon={onboardingIcons.inviteLink}
        label={'Paste link'}
        onClick={onPasteLink}
        dataTestId='link-devices-paste-link'
      />
    </RowGroup>
    <LinkedDevicesList devices={linkedDevices} />
  </OnboardingBody>
)

export default LinkDevicesComponent

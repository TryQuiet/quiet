import React from 'react'

import { ActionRow } from './ActionRow'
import { OnboardingBody, RowGroup } from './OnboardingBody'
import { onboardingIcons } from './icons'

export interface LinkDevicesComponentProps {
  onDisplayQrCode: () => void
  onScanQrCode: () => void
}

/** Link devices · Figma 2811:2575. */
export const LinkDevicesComponent: React.FC<LinkDevicesComponentProps> = ({ onDisplayQrCode, onScanQrCode }) => {
  return (
    <OnboardingBody
      heading={'Link devices'}
      intro={
        'Display the QR code on one device and scan it with another. Linked devices share all communities, and you will not lose access to anything.'
      }
      dataTestId='link-devices'
    >
      <RowGroup>
        <ActionRow
          icon={onboardingIcons.qrDisplay}
          label={'Display QR code'}
          onClick={onDisplayQrCode}
          dataTestId='link-devices-display-qr'
        />
        <ActionRow
          icon={onboardingIcons.qrScan}
          label={'Scan QR code'}
          onClick={onScanQrCode}
          dataTestId='link-devices-scan-qr'
        />
      </RowGroup>
    </OnboardingBody>
  )
}

export default LinkDevicesComponent

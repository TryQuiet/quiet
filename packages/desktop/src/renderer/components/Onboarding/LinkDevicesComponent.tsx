import React from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'

import { ActionRow } from './ActionRow'
import { OnboardingBody, RowGroup } from './OnboardingBody'
import { onboardingIcons } from './icons'

/**
 * Which way this device links (user decision, 2026-09-13): inside a community it
 * shares — Display QR code and Copy link; without one it receives — Scan QR code and
 * Paste link. The rows of the other direction are not drawn.
 */
export type LinkDevicesDirection = 'share' | 'receive'

export interface LinkDevicesComponentProps {
  direction: LinkDevicesDirection
  /** share: opens the QR code sheet. */
  onDisplayQrCode?: () => void
  /**
   * share: the device link to copy (the same link the QR sheet shows); empty
   * while it is being minted, in which case the row asks for one via `onCopyLink`.
   */
  deviceLink?: string
  onCopyLink?: () => void
  /** share: after the link was put on the clipboard (show the confirmation). */
  onLinkCopied?: () => void
  /** receive: opens the camera. */
  onScanQrCode?: () => void
  /** receive: the Paste link row (user addition, 2026-09-13; not in 2811:2575). */
  onPasteLink?: () => void
}

/**
 * Link devices · Figma 2811:2575, in the shell of the Device-linking desktop frames
 * 879:20987 / 880:17196: the rows in the library's bordered group. The rows follow the
 * direction (above). Copy link and Paste link carry the library's link glyph (the one
 * Join with invite link uses on 2811:2562); their labels are not the designer's.
 *
 * The frames also draw a "Linked devices" list under the rows. It is not built: nothing
 * on this line can enumerate a user's devices (TryQuiet/quiet#3636), and a card that
 * always read "No linked devices" would state something false as soon as a device was
 * linked. The list returns with the backend that can fill it.
 */
export const LinkDevicesComponent: React.FC<LinkDevicesComponentProps> = ({
  direction,
  onDisplayQrCode,
  deviceLink = '',
  onCopyLink,
  onLinkCopied,
  onScanQrCode,
  onPasteLink,
}) => {
  const copyRow = (
    <ActionRow
      icon={onboardingIcons.inviteLink}
      label={'Copy link'}
      onClick={deviceLink ? undefined : onCopyLink}
      dataTestId='link-devices-copy-link'
    />
  )
  return (
    <OnboardingBody
      heading={'Link devices'}
      intro={
        'Display the QR code on one device and scan it with another. Linked devices share all communities, and you will not lose access to anything.'
      }
      dataTestId='link-devices'
    >
      <RowGroup bordered dataTestId='link-devices-rows'>
        {direction === 'share' ? (
          <>
            <ActionRow
              icon={onboardingIcons.qrDisplay}
              label={'Display QR code'}
              onClick={onDisplayQrCode}
              dataTestId='link-devices-display-qr'
            />
            {deviceLink ? (
              <CopyToClipboard text={deviceLink} onCopy={onLinkCopied}>
                {copyRow}
              </CopyToClipboard>
            ) : (
              copyRow
            )}
          </>
        ) : (
          <>
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
          </>
        )}
      </RowGroup>
    </OnboardingBody>
  )
}

export default LinkDevicesComponent

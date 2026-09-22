import React, { FC } from 'react'
import { View } from 'react-native'

import { InviteLinkIcon, QrDisplayIcon, QrScanIcon } from '../../assets/icons/svg/onboarding-icons'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { ActionRow } from '../ActionRow/ActionRow.component'
import { Appbar } from '../Appbar/Appbar.component'
import { Typography } from '../Typography/Typography.component'

import type { LinkDevicesProps } from './LinkDevices.types'

/** The library's bordered group / card (2811:2575 "Buttons"): 1px #E5E5E5, r16. */
const card = {
  borderWidth: 1,
  borderColor: defaultTheme.palette.border.card,
  borderRadius: 16,
  overflow: 'hidden' as const,
}

/**
 * Link devices · Figma 2811:2575 (states 879:15640 / 879:15644 in the Device-linking
 * file): a full-screen h1 stage, so the bar shows the back glyph alone (no title, no
 * divider), and the rows in the bordered group. The frames also draw a Linked devices
 * list below them; it is not built, because nothing on this line can enumerate a user's
 * devices (TryQuiet/quiet#3636) and a card that always read "No linked devices" would be
 * false as soon as a device was linked. Nor is the frames' trash glyph: #3400 ships no
 * device removal. The rows follow the direction (LinkDevicesDirection); Copy link and
 * Paste link carry the library's link glyph (the one Join with invite link uses on
 * 2811:2562), their labels are not the designer's (user decisions, 2026-09-13).
 */
export const LinkDevices: FC<LinkDevicesProps> = ({
  direction,
  onDisplayQrCode,
  onCopyLink,
  onScanQrCode,
  onPasteLink,
  handleBackButton,
}) => {
  return (
    <View style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }} testID={'link-devices-component'}>
      <Appbar title={'Link devices'} back={handleBackButton} withoutTitle />
      <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.xl }}>
        <View style={{ gap: spacing.sm }}>
          <Typography variant={'h3'} horizontalTextAlign={'center'}>
            {'Link devices'}
          </Typography>
          <Typography variant={'body'} horizontalTextAlign={'center'}>
            {
              'Display the QR code on one device and scan it with another. Linked devices share all communities, and you will not lose access to anything.'
            }
          </Typography>
        </View>
        <View style={{ ...card, paddingHorizontal: spacing.lg }} testID={'link-devices-rows'}>
          {direction === 'share' ? (
            <>
              <ActionRow
                icon={<QrDisplayIcon />}
                label={'Display QR code'}
                onPress={onDisplayQrCode}
                testID={'link-devices-display-qr'}
              />
              <ActionRow
                icon={<InviteLinkIcon />}
                label={'Copy link'}
                onPress={onCopyLink}
                divider={false}
                testID={'link-devices-copy-link'}
              />
            </>
          ) : (
            <>
              <ActionRow
                icon={<QrScanIcon />}
                label={'Scan QR code'}
                onPress={onScanQrCode}
                testID={'link-devices-scan-qr'}
              />
              <ActionRow
                icon={<InviteLinkIcon />}
                label={'Paste link'}
                onPress={onPasteLink}
                divider={false}
                testID={'link-devices-paste-link'}
              />
            </>
          )}
        </View>
      </View>
    </View>
  )
}

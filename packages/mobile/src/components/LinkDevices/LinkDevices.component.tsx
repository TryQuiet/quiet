import React, { FC } from 'react'
import { View } from 'react-native'

import { QrDisplayIcon, QrScanIcon } from '../../assets/icons/svg/onboarding-icons'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { ActionRow } from '../ActionRow/ActionRow.component'
import { Appbar } from '../Appbar/Appbar.component'
import { Typography } from '../Typography/Typography.component'

import type { LinkDevicesProps } from './LinkDevices.types'

/** Link devices · Figma 2811:2575. */
export const LinkDevices: FC<LinkDevicesProps> = ({
  onDisplayQrCode,
  onScanQrCode,
  canDisplayQrCode = true,
  handleBackButton,
}) => {
  return (
    <View style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }} testID={'link-devices-component'}>
      {/* The screen's own h3 says "Link devices"; a page with a heading gets no bar title. */}
      <Appbar withoutTitle back={handleBackButton} />
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
        <View>
          <ActionRow
            icon={<QrDisplayIcon />}
            label={'Display QR code'}
            onPress={onDisplayQrCode}
            disabled={!canDisplayQrCode}
            testID={'link-devices-display-qr'}
          />
          <ActionRow
            icon={<QrScanIcon />}
            label={'Scan QR code'}
            onPress={onScanQrCode}
            testID={'link-devices-scan-qr'}
          />
        </View>
      </View>
    </View>
  )
}

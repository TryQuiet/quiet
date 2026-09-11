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
  linkedDevices,
  handleBackButton,
}) => {
  const others = (linkedDevices ?? []).filter(device => !device.isCurrent)
  return (
    <View style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }} testID={'link-devices-component'}>
      <Appbar title={'Link devices'} back={handleBackButton} />
      <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.xl }}>
        <View style={{ gap: spacing.sm }}>
          <Typography variant={'h3'}>{'Link devices'}</Typography>
          <Typography variant={'body'}>
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
        <View style={{ gap: spacing.sm }} testID={'linked-devices-list'}>
          <Typography variant={'overline'} color={'gray50'}>
            {'Linked devices'}
          </Typography>
          {others.length === 0 ? (
            <Typography variant={'body'} color={'grayDark'} testID={'no-linked-devices'}>
              {'No linked devices'}
            </Typography>
          ) : (
            others.map(device => (
              <View
                key={device.deviceId}
                style={{
                  paddingVertical: spacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: defaultTheme.palette.typography.veryLightGray,
                }}
                testID={`linked-device-${device.deviceName}`}
              >
                <Typography variant={'bodyLg'}>{device.deviceName}</Typography>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  )
}

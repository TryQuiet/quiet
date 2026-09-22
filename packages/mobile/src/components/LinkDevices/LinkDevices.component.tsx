import React, { FC } from 'react'
import { ScrollView, View } from 'react-native'

import { QrDisplayIcon, QrScanIcon } from '../../assets/icons/svg/onboarding-icons'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { ActionRow } from '../ActionRow/ActionRow.component'
import { Appbar } from '../Appbar/Appbar.component'
import { Typography } from '../Typography/Typography.component'

import type { LinkedDevice } from '@quiet/types'

import type { LinkDevicesProps } from './LinkDevices.types'

/**
 * The rows the list draws: the other devices on this account. This device is
 * never one of them (it is the one being read from), and a device removed from
 * the account is gone from the list even though the graph still carries it.
 * Rows are keyed and identified by `deviceId`; only the name is displayed, and
 * names are not guaranteed unique.
 */
export const otherLinkedDevices = (linkedDevices: LinkedDevice[]): LinkedDevice[] =>
  linkedDevices.filter(device => !device.isCurrent && device.removedAt == null)

/** Link devices · Figma 2811:2575. */
export const LinkDevices: FC<LinkDevicesProps> = ({
  onDisplayQrCode,
  onScanQrCode,
  canDisplayQrCode = true,
  linkedDevices,
  handleBackButton,
}) => {
  const otherDevices = linkedDevices ? otherLinkedDevices(linkedDevices) : undefined
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
        {otherDevices ? (
          <View style={{ flex: 1, gap: spacing.sm }} testID={'linked-devices-list'}>
            {/* The frame draws this overline with the screen's own words; the h3 above
                says "Link devices" and this says "Linked devices", so the testid is what
                tests key on rather than either string. */}
            <Typography variant={'overline'} color={'gray50'} testID={'linked-devices-list-label'}>
              {'Linked devices'}
            </Typography>
            {otherDevices.length === 0 ? (
              <Typography variant={'body'} color={'grayDark'} testID={'no-linked-devices'}>
                {'No linked devices'}
              </Typography>
            ) : (
              // A phone fits about eight rows; past that the list scrolls rather than
              // running off the screen (desktop sits inside the settings drawer's scroll).
              <ScrollView testID={'linked-devices-scroll'}>
                {otherDevices.map(device => (
                  <View
                    key={device.deviceId}
                    style={{
                      paddingVertical: spacing.sm,
                      borderBottomWidth: 1,
                      borderBottomColor: defaultTheme.palette.typography.veryLightGray,
                    }}
                    testID={`linked-device-${device.deviceId}`}
                  >
                    <Typography variant={'bodyLg'}>{device.deviceName}</Typography>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}
      </View>
    </View>
  )
}

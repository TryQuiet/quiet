import React, { FC } from 'react'
import { ScrollView, View } from 'react-native'

import { InviteLinkIcon, QrDisplayIcon, QrScanIcon } from '../../assets/icons/svg/onboarding-icons'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { ActionRow } from '../ActionRow/ActionRow.component'
import { Appbar } from '../Appbar/Appbar.component'
import { Typography } from '../Typography/Typography.component'

import type { LinkedDevice } from '@quiet/types'

import type { LinkDevicesProps } from './LinkDevices.types'

/**
 * The rows the list draws: the other devices on this account. This device is never one
 * of them (it is the one being read from), and a device removed from the account is gone
 * from the list even though the graph still carries it. Rows are keyed and identified by
 * `deviceId`; only the name is displayed, and names are not guaranteed unique.
 */
export const otherLinkedDevices = (devices: LinkedDevice[]): LinkedDevice[] =>
  devices.filter(device => !device.isCurrent && device.removedAt == null)

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
 * list below them; it is built on the share direction (TryQuiet/quiet#3636), where there
 * is a community and so a team graph to read the devices from. It stays unread rather
 * than empty until the backend answers, so the card never reads "No linked devices"
 * before the app knows, which was the reason it was held back. The frames' trash glyph
 * is still absent: #3400 ships no device removal. The rows follow the direction
 * (LinkDevicesDirection); Copy link and Paste link carry the library's link glyph (the
 * one Join with invite link uses on 2811:2562), their labels are not the designer's
 * (user decisions, 2026-09-13).
 */
export const LinkDevices: FC<LinkDevicesProps> = ({
  direction,
  onDisplayQrCode,
  onCopyLink,
  onScanQrCode,
  onPasteLink,
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
        {direction === 'share' && otherDevices ? (
          <View style={{ flex: 1, gap: spacing.sm }} testID={'linked-devices-list'}>
            {/* The frame draws this overline with words close to the screen's own h3,
                so tests key on the testid rather than either string. */}
            <Typography variant={'overline'} color={'gray50'} testID={'linked-devices-list-label'}>
              {'Linked devices'}
            </Typography>
            <View style={card}>
              {otherDevices.length === 0 ? (
                <Typography
                  variant={'body'}
                  color={'gray60'}
                  style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}
                  testID={'no-linked-devices'}
                >
                  {'No linked devices'}
                </Typography>
              ) : (
                // A phone fits about eight rows; past that the card scrolls rather than
                // running off the screen.
                <ScrollView testID={'linked-devices-scroll'}>
                  {otherDevices.map((device, index) => (
                    <View
                      key={device.deviceId}
                      style={{
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.sm,
                        borderBottomWidth: index === otherDevices.length - 1 ? 0 : 1,
                        borderBottomColor: defaultTheme.palette.border.hairline,
                      }}
                      testID={`linked-device-${device.deviceId}`}
                    >
                      <Typography variant={'bodyLg'}>{device.deviceName}</Typography>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  )
}

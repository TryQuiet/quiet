import React, { FC } from 'react'
import { View } from 'react-native'
import { InvitationDataVersion, type DeviceInvitationData } from '@quiet/types'

import LockIcon from '../../assets/icons/svg/lock'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Button } from '../Button/Button.component'
import { Typography } from '../Typography/Typography.component'

const SPACING_UNIT = 8
const GAP_CONTENT = SPACING_UNIT * 3
const GAP_TEXT = SPACING_UNIT * 2
const GAP_ACTIONS = SPACING_UNIT * 2

export interface DeviceLinkConsentProps {
  inviteData: DeviceInvitationData
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const DeviceLinkConsent: FC<DeviceLinkConsentProps> = ({ inviteData, visible, onConfirm, onCancel }) => {
  if (!visible) return null

  const qssEndpoint =
    inviteData.version === InvitationDataVersion.v5 && inviteData.qssEnabled ? inviteData.qssEndpoint : undefined

  return (
    <View style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }} testID='device-link-consent'>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: GAP_CONTENT,
          paddingHorizontal: SPACING_UNIT * 4,
        }}
      >
        <View style={{ alignItems: 'center', gap: GAP_TEXT }}>
          <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
            <LockIcon size={64} />
          </View>
          <Typography fontSize={28} fontWeight='bold'>
            Link this device?
          </Typography>
          <Typography fontSize={14} color='subtitle' style={{ textAlign: 'center', maxWidth: 320 }}>
            {qssEndpoint ? (
              <>
                Quiet will contact {qssEndpoint} directly. That server can see your IP address. Continue only if you
                trust this endpoint and the person who shared the link.
              </>
            ) : (
              'Quiet will connect to the linked device over Tor. Continue only if you trust the person who shared the link.'
            )}
          </Typography>
        </View>
        <View style={{ width: 'auto', gap: GAP_ACTIONS }}>
          <Button title='Link device' onPress={onConfirm} testID='device-link-confirm' />
          <Button title='No thanks' onPress={onCancel} negative testID='device-link-cancel' />
        </View>
      </View>
    </View>
  )
}

export default DeviceLinkConsent

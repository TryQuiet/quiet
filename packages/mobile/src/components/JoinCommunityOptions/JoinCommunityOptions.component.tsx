import React, { FC } from 'react'
import { View } from 'react-native'

import { InfoIcon, InviteLinkIcon, QrCodeIcon } from '../../assets/icons/svg/onboarding-icons'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { ActionRow } from '../ActionRow/ActionRow.component'
import { Appbar } from '../Appbar/Appbar.component'
import { Typography } from '../Typography/Typography.component'

import type { JoinCommunityOptionsProps } from './JoinCommunityOptions.types'

/**
 * Join community · Figma 2811:2562: the three-way choice. "Recover account"
 * has no mechanism yet, so its row is present but disabled.
 */
export const JoinCommunityOptions: FC<JoinCommunityOptionsProps> = ({
  onJoinWithInviteLink,
  onJoinWithQrCode,
  handleBackButton,
}) => (
  <View
    style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}
    testID={'join-community-options-component'}
  >
    <Appbar title={'Quiet'} back={handleBackButton} />
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.xl }}>
      <Typography variant={'h3'} horizontalTextAlign={'center'}>
        {'Join community'}
      </Typography>
      <View>
        <ActionRow
          icon={<InviteLinkIcon />}
          label={'Join with invite link'}
          onPress={onJoinWithInviteLink}
          testID={'join-with-invite-link'}
        />
        <ActionRow
          icon={<QrCodeIcon />}
          label={'Join with QR code'}
          onPress={onJoinWithQrCode}
          testID={'join-with-qr-code'}
        />
        <ActionRow icon={<InfoIcon />} label={'Recover account'} disabled testID={'recover-account'} />
      </View>
    </View>
  </View>
)

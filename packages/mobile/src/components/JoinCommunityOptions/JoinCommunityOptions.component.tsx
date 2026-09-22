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
 * opens the Account recovery screen (2811:2535), whose routes are the
 * existing Link devices and Join with invite link flows. The frame hides its
 * bar title ("Quiet"): the back glyph alone, the heading is the title, content
 * top-anchored 24 under the bar zone.
 */
export const JoinCommunityOptions: FC<JoinCommunityOptionsProps> = ({
  onJoinWithInviteLink,
  onJoinWithQrCode,
  onRecoverAccount,
  handleBackButton,
}) => (
  <View
    style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}
    testID={'join-community-options-component'}
  >
    <Appbar withoutTitle back={handleBackButton} />
    <View style={{ flex: 1, paddingTop: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.xl }}>
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
        <ActionRow
          icon={<InfoIcon />}
          label={'Recover account'}
          onPress={onRecoverAccount}
          testID={'recover-account'}
        />
      </View>
    </View>
  </View>
)

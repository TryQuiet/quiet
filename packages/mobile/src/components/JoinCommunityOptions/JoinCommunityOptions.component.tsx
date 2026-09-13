import React, { FC } from 'react'
import { Image, View } from 'react-native'

import { icons } from '../../assets'
import { InfoIcon, InviteLinkIcon, QrCodeIcon } from '../../assets/icons/svg/onboarding-icons'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { ActionRow } from '../ActionRow/ActionRow.component'
import { Appbar } from '../Appbar/Appbar.component'
import { Typography } from '../Typography/Typography.component'

import type { JoinCommunityOptionsProps } from './JoinCommunityOptions.types'

/** The frame's Graphic--heart-chat instance (I2815:2504;6181:27547), exported at 1×/2×/3×. */
export const GRAPHIC_SIZE = { width: 219, height: 160 } as const

/**
 * Join community · Figma 2811:2562: the heart-chat illustration directly under
 * the title bar, the title, then the three-way choice — top-anchored, 24 apart,
 * as in the frame (graphic at y 60, title at 244, rows from 302). "Recover
 * account" has no mechanism yet, so its row is present but disabled.
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
    <View style={{ flex: 1, paddingHorizontal: spacing.lg, gap: spacing.xl }}>
      <Image
        source={icons.graphic_heart_chat}
        style={{ ...GRAPHIC_SIZE, alignSelf: 'center' }}
        accessible={false}
        testID={'join-community-graphic'}
      />
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

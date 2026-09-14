import React, { FC } from 'react'
import { View } from 'react-native'

import { InfoIcon, InviteLinkIcon, LinkDevicesIcon, MoreHorizIcon } from '../../assets/icons/svg/onboarding-icons'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { ActionRow } from '../ActionRow/ActionRow.component'
import { Appbar } from '../Appbar/Appbar.component'
import { Typography } from '../Typography/Typography.component'

import type { RecoverAccountProps } from './RecoverAccount.types'

/**
 * Account recovery · Figma 2811:2535. The frame's illustration is the
 * library's "Icon=Vpn key" glyph at 64px. The prototype wires "Use linked
 * device" to Link devices and "Use invite link" to Open invite link; "More
 * options" is drawn but goes nowhere, so its row is present and inert. There
 * is no separate recovery mechanism: both routes are the existing flows. The
 * frame hides its bar title ("Account recovery"): glyph only, content top-anchored.
 */
export const RecoverAccount: FC<RecoverAccountProps> = ({ onUseLinkedDevice, onUseInviteLink, handleBackButton }) => (
  <View
    style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}
    testID={'recover-account-component'}
  >
    <Appbar withoutTitle back={handleBackButton} />
    <View style={{ flex: 1, paddingTop: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.xl }}>
      <View style={{ alignSelf: 'center' }}>
        <InfoIcon size={64} />
      </View>
      <View style={{ gap: spacing.sm }}>
        <Typography variant={'h3'} horizontalTextAlign={'center'}>
          {'Recover account'}
        </Typography>
        <Typography variant={'body'} horizontalTextAlign={'center'}>
          {'Locked out? You can recover with a linked device or ask an admin to send you an invite link.'}
        </Typography>
      </View>
      <View>
        <ActionRow
          icon={<LinkDevicesIcon />}
          label={'Use linked device'}
          onPress={onUseLinkedDevice}
          testID={'recover-use-linked-device'}
        />
        <ActionRow
          icon={<InviteLinkIcon />}
          label={'Use invite link'}
          onPress={onUseInviteLink}
          testID={'recover-use-invite-link'}
        />
        <ActionRow icon={<MoreHorizIcon />} label={'More options'} disabled testID={'recover-more-options'} />
      </View>
    </View>
  </View>
)

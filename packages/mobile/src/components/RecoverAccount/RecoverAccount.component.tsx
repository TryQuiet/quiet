import React, { FC } from 'react'
import { View } from 'react-native'

import { InfoIcon, InviteLinkIcon, LinkDevicesIcon } from '../../assets/icons/svg/onboarding-icons'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { ActionRow } from '../ActionRow/ActionRow.component'
import { Appbar } from '../Appbar/Appbar.component'
import { Typography } from '../Typography/Typography.component'

import type { RecoverAccountProps } from './RecoverAccount.types'
import { RECOVER_ACCOUNT_HEADING } from '@quiet/common'

/**
 * Account recovery · Figma 2811:2535. The frame's illustration is the
 * library's "Icon=Vpn key" glyph at 64px. The prototype wires "Use linked
 * device" to Link devices and "Use invite link" to Open invite link. The
 * frame also draws a "More options" row, but it has no target anywhere in
 * the prototype, so it is omitted until the design gives it one (user,
 * 2026-09-22). There is no separate recovery mechanism: both routes are the
 * existing flows. The frame hides its bar title ("Account recovery"): glyph
 * only, content top-anchored.
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
          {RECOVER_ACCOUNT_HEADING}
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
      </View>
    </View>
  </View>
)

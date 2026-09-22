import React, { FC } from 'react'
import { Image, TouchableOpacity, View } from 'react-native'

import { icons } from '../../assets'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { Appbar } from '../Appbar/Appbar.component'
import { Typography } from '../Typography/Typography.component'

import type { OpenInviteLinkProps } from './OpenInviteLink.types'
import { JOIN_WITH_INVITE_LINK_HEADING, PASTE_A_LINK_LABEL } from '@quiet/common'

/** Open invite link · Figma 2811:2455. The frame hides its bar title ("Join with invite link"): glyph only, content top-anchored. */
export const OpenInviteLink: FC<OpenInviteLinkProps> = ({ onPasteLink, handleBackButton }) => (
  <View
    style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}
    testID={'open-invite-link-component'}
  >
    <Appbar withoutTitle back={handleBackButton} />
    <View style={{ flex: 1, paddingTop: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.lg }}>
      <Image source={icons.monster} style={{ width: 120, height: 120, alignSelf: 'center' }} accessible={false} />
      <View style={{ gap: spacing.sm }}>
        <Typography variant={'h3'} horizontalTextAlign={'center'}>
          {JOIN_WITH_INVITE_LINK_HEADING}
        </Typography>
        <Typography variant={'body'} horizontalTextAlign={'center'}>
          {'Open an invite link from a community admin. (If you just installed Quiet, open the invite again!)'}
        </Typography>
      </View>
      <TouchableOpacity
        onPress={onPasteLink}
        testID={'paste-a-link'}
        accessibilityRole='button'
        style={{ alignSelf: 'center' }}
      >
        <Typography variant={'bodyLg'} color={'blue'} horizontalTextAlign={'center'}>
          {PASTE_A_LINK_LABEL}
        </Typography>
      </TouchableOpacity>
    </View>
  </View>
)

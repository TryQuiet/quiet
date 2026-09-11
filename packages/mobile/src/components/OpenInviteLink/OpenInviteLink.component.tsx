import React, { FC } from 'react'
import { Image, TouchableOpacity, View } from 'react-native'

import { icons } from '../../assets'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { Appbar } from '../Appbar/Appbar.component'
import { Typography } from '../Typography/Typography.component'

import type { OpenInviteLinkProps } from './OpenInviteLink.types'

/** Open invite link · Figma 2811:2455. */
export const OpenInviteLink: FC<OpenInviteLinkProps> = ({ onPasteLink, handleBackButton }) => (
  <View
    style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}
    testID={'open-invite-link-component'}
  >
    <Appbar title={'Join with invite link'} back={handleBackButton} />
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.lg }}>
      <Image source={icons.monster} style={{ width: 120, height: 120, alignSelf: 'center' }} accessible={false} />
      <View style={{ gap: spacing.sm }}>
        <Typography variant={'h3'} horizontalTextAlign={'center'}>
          {'Join with invite link'}
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
          {'Paste a link'}
        </Typography>
      </TouchableOpacity>
    </View>
  </View>
)

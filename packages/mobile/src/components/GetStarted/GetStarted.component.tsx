import React, { FC } from 'react'
import { Image, View } from 'react-native'

import { icons } from '../../assets'
import { LinkDevicesIcon, PersonAddIcon, PlusIcon } from '../../assets/icons/svg/onboarding-icons'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { ActionRow } from '../ActionRow/ActionRow.component'
import { Typography } from '../Typography/Typography.component'

import type { GetStartedProps } from './GetStarted.types'

export const BETA_WARNING = "Quiet is in beta and shouldn't be used for activities requiring security."

/**
 * Get started · Figma 2811:2550. No app bar at all: the frame's "Quiet" bar did
 * not feel right on mobile (decided 2026-09-13). The other full-screen
 * onboarding stages keep the bar zone for their back glyph but hide the title
 * (Appbar's withoutTitle). The content starts at the safe area App.tsx provides.
 */
export const GetStarted: FC<GetStartedProps> = ({ onJoinCommunity, onCreateCommunity, onLinkDevices }) => (
  <View style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }} testID={'get-started-component'}>
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.xl }}>
      <Image
        source={icons.get_started_circle_logo}
        style={{ width: 120, height: 120, alignSelf: 'center' }}
        accessible={false}
      />
      <Typography variant={'h3'} horizontalTextAlign={'center'}>
        {'Let’s get started...'}
      </Typography>
      <View>
        <ActionRow
          icon={<PersonAddIcon />}
          label={'Join a community'}
          onPress={onJoinCommunity}
          testID={'get-started-join'}
        />
        <ActionRow
          icon={<PlusIcon />}
          label={'Create a new community'}
          onPress={onCreateCommunity}
          testID={'get-started-create'}
        />
        <ActionRow
          icon={<LinkDevicesIcon />}
          label={'Link devices'}
          onPress={onLinkDevices}
          testID={'get-started-link-devices'}
        />
      </View>
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: spacing.xs }}
        testID={'beta-warning'}
      >
        <Image source={icons.icon_warning} resizeMode='cover' resizeMethod='resize' style={{ width: 16, height: 16 }} />
        {/*
         * The beta line is drawn as `Status`, Rubik 12/16 w400 #222222 - Get started 6066:27523,
         * and the same in all 21 beta-warning nodes across the four onboarding files. It is not
         * the library's general caption grey. `gray90` is that ink; desktop took it in #3666.
         */}
        <Typography variant={'caption'} color={'gray90'} horizontalTextAlign={'center'} style={{ flexShrink: 1 }}>
          {BETA_WARNING}
        </Typography>
      </View>
    </View>
  </View>
)

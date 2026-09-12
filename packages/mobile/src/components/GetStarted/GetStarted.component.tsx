import React, { FC } from 'react'
import { Image, View } from 'react-native'

import { icons } from '../../assets'
import { LinkDevicesIcon, PersonAddIcon, PlusIcon } from '../../assets/icons/svg/onboarding-icons'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { ActionRow } from '../ActionRow/ActionRow.component'
import { Appbar } from '../Appbar/Appbar.component'
import { Typography } from '../Typography/Typography.component'

import type { GetStartedProps } from './GetStarted.types'

export const BETA_WARNING = "Quiet is in beta and shouldn't be used for activities requiring security."

/** Get started · Figma 2811:2550. */
export const GetStarted: FC<GetStartedProps> = ({ onJoinCommunity, onCreateCommunity, onLinkDevices }) => (
  <View style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }} testID={'get-started-component'}>
    <Appbar title={'Quiet'} plain />
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.xl }}>
      <Image source={icons.quiet_icon} style={{ width: 100, height: 100, alignSelf: 'center' }} accessible={false} />
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
        <Typography variant={'caption'} color={'grayDark'} horizontalTextAlign={'center'} style={{ flexShrink: 1 }}>
          {BETA_WARNING}
        </Typography>
      </View>
    </View>
  </View>
)

import React from 'react'
import { View } from 'react-native'
import LockIcon from '../../assets/icons/svg/lock'
import { DefaultAppbarTitle } from '../Appbar/DefaultAppbarHeaderTitle.component'
import { HeaderTitleProps } from '../Appbar/Appbar.types'
import { ChannelMembershipHeaderTitleProps } from './ChannelMembership.types'
import { Typography } from '../Typography/Typography.component'

export const ChannelMembershipAppbarHeaderTitle: React.FC<ChannelMembershipHeaderTitleProps> = (
  props: ChannelMembershipHeaderTitleProps
) => {
  const fontSize = props.fontSize ?? 16
  const fontWeight = props.fontWeight ?? 'medium'
  return (
    <View style={{ display: 'flex', flexDirection: 'column', alignContent: 'center', alignItems: 'center' }}>
      <DefaultAppbarTitle title={props.title} fontSize={fontSize} fontWeight={fontWeight} />
      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <LockIcon fill={true} size={16} />
        <Typography fontSize={12}>{props.channelName}</Typography>
      </View>
    </View>
  )
}

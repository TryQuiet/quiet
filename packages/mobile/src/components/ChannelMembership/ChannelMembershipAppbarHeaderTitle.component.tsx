import React from 'react'
import { View } from 'react-native'
import LockIcon from '../../assets/icons/svg/lock'
import { DefaultAppbarTitle } from '../Appbar/DefaultAppbarHeaderTitle.component'
import { ChannelMembershipHeaderTitleProps } from './ChannelMembership.types'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import { ChannelType } from '@quiet/types'

export const ChannelMembershipAppbarHeaderTitle: React.FC<ChannelMembershipHeaderTitleProps> = ({
  title,
  fontSize = 16,
  fontWeight = 'medium',
  channelTitle,
  channelType,
  membershipCount,
}) => {
  return (
    <View style={{ display: 'flex', flexDirection: 'column', alignContent: 'center', alignItems: 'center' }}>
      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', alignContent: 'center', gap: 6 }}>
        <DefaultAppbarTitle title={title} fontSize={fontSize} fontWeight={fontWeight} />
        <Typography
          fontSize={fontSize}
          fontWeight={'normal'}
          style={{
            color: defaultTheme.palette.typography.gray50,
          }}
        >
          {membershipCount ?? ''}
        </Typography>
      </View>
      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        {channelType === ChannelType.CHANNEL && <LockIcon fill={true} size={16} />}
        <Typography fontSize={12}>{channelTitle}</Typography>
      </View>
    </View>
  )
}

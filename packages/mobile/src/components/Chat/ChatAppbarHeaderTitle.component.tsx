import React from 'react'
import { View } from 'react-native'
import { ChatAppbarHeaderTitleProps } from './Chat.types'
import LockIcon from '../../assets/icons/svg/lock'
import PublicChannelIcon from '../../assets/icons/svg/public-channel'
import { DefaultAppbarTitle } from '../Appbar/DefaultAppbarHeaderTitle.component'
import { ChannelType } from '@quiet/types'

export const ChatAppbarHeaderTitle: React.FC<ChatAppbarHeaderTitleProps> = (props: ChatAppbarHeaderTitleProps) => {
  const fontSize = props.fontSize ?? 16
  const fontWeight = props.fontWeight ?? 'medium'
  return (
    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      {!props.isNewChat &&
        props.channelType != ChannelType.DM &&
        (!props.isPublic ? <LockIcon fill={true} /> : <PublicChannelIcon />)}
      <DefaultAppbarTitle title={props.title} fontSize={fontSize} fontWeight={fontWeight} />
    </View>
  )
}

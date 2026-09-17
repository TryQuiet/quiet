import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { ChatAppbarHeaderTitleProps } from './Chat.types'
import LockIcon from '../../assets/icons/svg/lock'
import PublicChannelIcon from '../../assets/icons/svg/public-channel'
import { DefaultAppbarTitle } from '../Appbar/DefaultAppbarHeaderTitle.component'
import { ChannelType } from '@quiet/types'
import { Typography } from '../Typography/Typography.component'
import { memberCountLabel } from '../../utils/functions/channelMembers/channelMembers'

export const ChatAppbarHeaderTitle: React.FC<ChatAppbarHeaderTitleProps> = (props: ChatAppbarHeaderTitleProps) => {
  const fontSize = props.fontSize ?? 16
  const fontWeight = props.fontWeight ?? 'medium'
  return (
    <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* A one-to-one DM names one person, so its title leads to them — as the message author and
          the member rows do. A channel names no one, and a group DM names several. */}
      <TouchableOpacity
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
        onPress={props.openUserProfile}
        disabled={props.openUserProfile == null}
        testID={'chat-appbar-title'}
      >
        {!props.isNewChat &&
          props.channelType != ChannelType.DM &&
          (!props.isPublic ? <LockIcon fill={true} /> : <PublicChannelIcon />)}
        <DefaultAppbarTitle title={props.title} fontSize={fontSize} fontWeight={fontWeight} />
      </TouchableOpacity>
      {/* The design's meta line under the channel name (Figma PVQ1Kjf6Cq8ng1czuVtvR8, 838:9711):
          12/14.22 with 0.4 of tracking. It also carries the disappearing-messages and auto-delete
          segments, which are not built, so only the count is drawn. */}
      {props.memberCount != null && (
        <Typography fontSize={12} style={{ lineHeight: 14, letterSpacing: 0.4 }} testID={'chat-appbar-member-count'}>
          {memberCountLabel(props.memberCount)}
        </Typography>
      )}
    </View>
  )
}

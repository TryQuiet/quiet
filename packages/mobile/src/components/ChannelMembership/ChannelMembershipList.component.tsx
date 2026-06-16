import { FlatList, ListRenderItemInfo, View } from 'react-native'

import { ChannelMembershipListProps } from './ChannelMembershipList.types'
import { ProfilePhoto } from '../ProfilePhoto/ProfilePhoto.component'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import { UserProfile } from '@quiet/types'
import { Spinner } from '../Spinner/Spinner.component'
import { USER_ROW_HEIGHT } from './ChannelMembership.types'

export const ChannelMembershipList: React.FC<ChannelMembershipListProps> = ({ members, channelId }) => {
  const renderItem = (listItem: ListRenderItemInfo<UserProfile>) => {
    const { item } = listItem
    const labelColor = defaultTheme.palette.typography.main
    return (
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignContent: 'center',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 11,
          paddingHorizontal: 16,
          height: USER_ROW_HEIGHT,
        }}
        testID={`channel-membership-list-item-${channelId}-${item.userId}`}
      >
        <ProfilePhoto
          userId={item.userId}
          username={item.nickname}
          photo={item.photo}
          profilePhoto={item.profilePhoto}
          borderRadius={4}
          size={32}
        />
        <Typography fontSize={16} style={{ color: labelColor }}>
          {item.nickname}
        </Typography>
      </View>
    )
  }

  return members == null ? (
    <View style={{ paddingVertical: 16 }}>
      <Spinner testID={`channel-membership-list-spinner-${channelId}`} description='Loading member list' />
    </View>
  ) : (
    <View>
      <Typography
        fontSize={10}
        style={{ color: defaultTheme.palette.typography.gray50, lineHeight: 16, paddingHorizontal: 16 }}
        testID={`channel-membership-list-header-${channelId}`}
      >
        MEMBERS
      </Typography>
      <FlatList
        data={[...members]}
        keyExtractor={item => item.userId}
        renderItem={item => renderItem(item)}
        ItemSeparatorComponent={() => {
          return <View style={{ height: 1, backgroundColor: defaultTheme.palette.background.gray06 }} />
        }}
        style={{ backgroundColor: defaultTheme.palette.background.white }}
        testID={`channel-membership-list-${channelId}`}
      />
      <View style={{ height: 1, backgroundColor: defaultTheme.palette.background.gray06 }} />
    </View>
  )
}

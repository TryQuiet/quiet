import { FlatList, ListRenderItemInfo, TouchableOpacity, View } from 'react-native'

import { ChannelMembershipListProps } from './ChannelMembershipList.types'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Spinner } from '../Spinner/Spinner.component'
import { USER_ROW_HEIGHT } from './ChannelMembership.types'
import { ProfilePhotoWithBadge } from '../ProfilePhoto/ProfilePhotoWithBadge.component'
import { ProfilePhotoSize, type DmChannelUserData } from '../ProfilePhoto/ProfilePhoto.types'

export const ChannelMembershipList: React.FC<ChannelMembershipListProps> = ({
  members,
  channelId,
  openUserProfile,
}) => {
  const renderItem = (listItem: ListRenderItemInfo<DmChannelUserData>) => {
    const { item } = listItem
    const labelColor = defaultTheme.palette.typography.main
    return (
      <TouchableOpacity
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignContent: 'center',
          alignItems: 'center',
          gap: 14,
          paddingVertical: 12,
          paddingHorizontal: 16,
          height: USER_ROW_HEIGHT,
        }}
        onPress={() => openUserProfile?.(item.user.userId)}
        disabled={openUserProfile == null}
        testID={`channel-membership-list-item-${channelId}-${item.user.userId}`}
      >
        <ProfilePhotoWithBadge userData={item} size={ProfilePhotoSize.MEDIUM} />
        <Typography fontSize={16} style={{ color: labelColor }}>
          {item.user.nickname}
        </Typography>
      </TouchableOpacity>
    )
  }

  return members == null ? (
    <View style={{ paddingVertical: 16 }}>
      <Spinner testID={`channel-membership-list-spinner-${channelId}`} description='Loading member list' />
    </View>
  ) : (
    <View>
      {/* The same "Header heading" the add-members list uses (Figma PVQ1Kjf6Cq8ng1czuVtvR8,
          838:9310): 10/16 medium, upper case, 1pt of tracking, 8pt clear of the first row. */}
      <Typography
        fontSize={10}
        fontWeight={'medium'}
        style={{
          color: defaultTheme.palette.typography.gray50,
          lineHeight: 16,
          letterSpacing: 1,
          paddingHorizontal: 16,
          paddingBottom: 8,
        }}
        testID={`channel-membership-list-header-${channelId}`}
      >
        MEMBERS
      </Typography>
      <FlatList
        data={[...members]}
        keyExtractor={item => item.user.userId}
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

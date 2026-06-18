import React, { FC, useEffect, useState } from 'react'
import { Animated, TouchableOpacity, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Typography } from '../Typography/Typography.component'
import { ChannelTileProps } from './ChannelTile.types'
import LockIcon from '../../assets/icons/svg/lock'
import PublicChannelIcon from '../../assets/icons/svg/public-channel'
import { ChannelType } from '@quiet/types'
import { ProfilePhotoWithBadge } from '../ProfilePhoto/ProfilePhotoWithBadge.component'
import { ProfilePhotoSize } from '../ProfilePhoto/ProfilePhoto.types'

export const ChannelTile: FC<ChannelTileProps> = ({
  name,
  id,
  unread,
  isPublic,
  channelType,
  redirect,
  representativeUserData,
  channel,
}) => {
  const [channelTitleColor, setChannelTitleColor] = useState<string>(defaultTheme.palette.typography.gray90)
  // TODO Question: can this be deleted?
  const _leftSwipe = (_progress: any, dragX: any) => {
    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1.4],
      extrapolate: 'clamp',
    })
    return (
      <TouchableOpacity
        onPress={() => {}}
        activeOpacity={0.6}
        style={{
          paddingLeft: 20,
          paddingTop: 4,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Typography fontSize={14} color={'error'}>
            Action
          </Typography>
        </Animated.View>
      </TouchableOpacity>
    )
  }

  useEffect(() => {
    setChannelTitleColor(unread ? defaultTheme.palette.typography.main : defaultTheme.palette.typography.gray90)
  }, [unread])

  const rowHeight = channelType === ChannelType.DM ? 24 : 20

  return (
    <GestureHandlerRootView>
      {/* <Swipeable friction={4} renderLeftActions={leftSwipe}> */}
      <TouchableOpacity
        testID={`channel_tile_${name}`}
        onPress={() => {
          redirect(id)
        }}
      >
        <View
          style={{
            paddingVertical: 8,
            paddingLeft: 12,
            paddingRight: 16,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
            }}
          >
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', height: rowHeight }}>
              <View style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                {channelType === ChannelType.DM ? (
                  <View style={{ paddingRight: 6 }}>
                    <ProfilePhotoWithBadge
                      userData={representativeUserData}
                      channel={channel}
                      size={ProfilePhotoSize.MEDIUM_SMALL}
                    />
                  </View>
                ) : !isPublic ? (
                  <LockIcon color={channelTitleColor} fill={true} size={18} bold={unread} />
                ) : (
                  <PublicChannelIcon color={channelTitleColor} size={18} bold={unread} />
                )}
                <Typography
                  fontSize={16}
                  fontWeight={unread ? 'medium' : 'normal'}
                  style={{ color: channelTitleColor }}
                  ellipsizeMode={'tail'}
                  numberOfLines={1}
                >
                  {name}
                </Typography>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  {unread && (
                    <View
                      style={{
                        width: 36,
                        height: 20,
                        backgroundColor: defaultTheme.palette.background.hotPink,
                        borderRadius: 100,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography fontSize={12} color={'white'} fontWeight={'medium'}>
                        new
                      </Typography>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      {/* </Swipeable> */}
    </GestureHandlerRootView>
  )
}

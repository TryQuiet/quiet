import React, { FC } from 'react'
import { Animated, TouchableOpacity, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Typography } from '../Typography/Typography.component'
import { ChannelTileProps } from './ChannelTile.types'
import LockIcon from '../../assets/icons/svg/lock'
import PublicChannelIcon from '../../assets/icons/svg/public-channel'

export const ChannelTile: FC<ChannelTileProps> = ({ name, id, unread, isPublic, redirect }) => {
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

  const channelTitleColor = (unread: boolean) => {
    return unread ? defaultTheme.palette.typography.gray70 : defaultTheme.palette.typography.grayLight
  }

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
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', height: 20 }}>
              <View style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                {!isPublic ? (
                  <LockIcon color={channelTitleColor(unread)} fill={true} size={18} />
                ) : (
                  <PublicChannelIcon color={channelTitleColor(unread)} size={18} />
                )}
                <Typography fontSize={16} fontWeight={'normal'} style={{ color: channelTitleColor(unread) }}>
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

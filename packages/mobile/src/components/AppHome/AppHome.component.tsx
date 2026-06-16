import React, { FC } from 'react'
import { FlatList, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Appbar } from '../Appbar/Appbar.component'
import { AppHomeProps } from './AppHome.types'
import { ChannelTile } from '../ChannelTile/ChannelTile.component'
import { Spinner } from '../Spinner/Spinner.component'
import { Typography } from '../Typography/Typography.component'
import { PlusButton } from '../IconButtons/PlusButton/PlusButton.component'
import { PencilButton } from '../IconButtons/PencilButton/PencilButton.component'
import { Overlay } from 'react-native-share'
import { FAB } from 'react-native-paper'

export const AppHome: FC<AppHomeProps> = ({
  community,
  channelTiles,
  dmTiles,
  createChannel,
  createDm,
  communityContextMenu,
  userProfiles,
  me,
}) => {
  let communityName = '...'
  if (community?.name) {
    communityName = community.name
  }
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: defaultTheme.palette.typography.darkPurple,
      }}
      testID={'messages-home-component'}
    >
      <Appbar
        title={communityName}
        position={'flex-start'}
        contextMenu={communityContextMenu}
        style={{
          backgroundColor: defaultTheme.palette.typography.darkPurple,
          borderBottomWidth: 0,
        }}
        iconColor={defaultTheme.palette.typography.white}
        textColor='white'
      />
      {channelTiles.length === 0 || !community ? (
        <Spinner description='Connecting to peers' />
      ) : (
        <View
          style={{
            backgroundColor: defaultTheme.palette.background.white,
            flexDirection: 'column',
            flex: 1,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <View
            style={{
              flexDirection: 'column',
              backgroundColor: defaultTheme.palette.background.white,
              justifyContent: 'flex-start',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
            testID={'messages-home-container'}
          >
            <View
              style={{
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                flexDirection: 'row',
                backgroundColor: defaultTheme.palette.background.white,
                paddingTop: 16,
                paddingBottom: 8,
                paddingLeft: 16,
                alignItems: 'center',
                alignContent: 'center',
                justifyContent: 'space-between',
              }}
              testID={'channel-list-title'}
            >
              <Typography fontSize={14} fontWeight={'medium'} color={'gray70'}>
                Channels
              </Typography>
              <PlusButton onPress={createChannel} />
            </View>
            <FlatList
              data={channelTiles}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <ChannelTile {...item} />}
              style={{ backgroundColor: defaultTheme.palette.background.white }}
              testID={'channel-list'}
            />
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: defaultTheme.palette.background.white,
                paddingTop: 16,
                paddingBottom: 8,
                paddingLeft: 16,
                alignItems: 'center',
                alignContent: 'center',
                justifyContent: 'space-between',
              }}
              testID={'dm-list-title'}
            >
              <Typography fontSize={14} fontWeight={'medium'} color={'gray70'}>
                Direct Messages
              </Typography>
              <PlusButton onPress={createDm} />
            </View>
            <FlatList
              data={dmTiles}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <ChannelTile {...item} />}
              style={{ backgroundColor: defaultTheme.palette.background.white }}
              testID={'dm-list'}
            />
          </View>
          <PencilButton onPress={createDm} />
        </View>
      )}
    </View>
  )
}

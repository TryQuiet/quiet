import React, { FC, useState } from 'react'
import { FlatList, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Appbar } from '../Appbar/Appbar.component'
import { ChannelListProps } from './ChannelList.types'
import { ChannelTile } from '../ChannelTile/ChannelTile.component'
import { Input } from '../Input/Input.component'
import { Spinner } from '../Spinner/Spinner.component'
import { Typography } from '../Typography/Typography.component'
import { capitalizeFirstLetter } from '@quiet/common'

export const ChannelList: FC<ChannelListProps> = ({ community, tiles, communityContextMenu }) => {
  const [query, setQuery] = useState('')

  let communityName = '...'
  if (community?.name) {
    communityName = capitalizeFirstLetter(community.name)
  }

  const needle = query.trim().toLowerCase()
  const visibleTiles = needle.length === 0 ? tiles : tiles.filter(tile => tile.name.toLowerCase().includes(needle))

  return (
    <View style={{ flex: 1 }} testID={'channel-list-component'}>
      <Appbar title={capitalizeFirstLetter(communityName)} position={'flex-start'} contextMenu={communityContextMenu} />
      {tiles.length === 0 || !community ? (
        <Spinner description='Connecting to peers' />
      ) : (
        <>
          <View
            style={{
              backgroundColor: defaultTheme.palette.background.white,
              borderBottomColor: defaultTheme.palette.background.gray06,
              borderBottomWidth: 1,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Input
              placeholder={'Search channels'}
              value={query}
              onChangeText={setQuery}
              capitalize={'none'}
              autoCorrect={false}
              round={true}
              testID={'channel_search_input'}
            />
          </View>
          <FlatList
            data={visibleTiles}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ChannelTile {...item} />}
            ItemSeparatorComponent={() => {
              return <View style={{ height: 1, backgroundColor: defaultTheme.palette.background.gray06 }} />
            }}
            ListEmptyComponent={
              <Typography
                fontSize={14}
                color={'gray50'}
                horizontalTextAlign={'center'}
                style={{ padding: 24 }}
                testID={'channels_list_empty'}
              >
                No channels found
              </Typography>
            }
            keyboardShouldPersistTaps={'handled'}
            keyboardDismissMode={'on-drag'}
            style={{ backgroundColor: defaultTheme.palette.background.white }}
            testID={'channels_list'}
          />
        </>
      )}
    </View>
  )
}

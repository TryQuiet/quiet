import React, { FC } from 'react'
import { FlatList, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { capitalize } from '../../utils/functions/capitalize/capitalize'
import { Appbar } from '../Appbar/Appbar.component'
import { ChannelListProps } from './ChannelList.types'
import { ChannelTile } from '../ChannelTile/ChannelTile.component'
import { Spinner } from '../Spinner/Spinner.component'

export const ChannelList: FC<ChannelListProps> = ({ community, tiles }) => {
  return (
    <View style={{ flex: 1 }}>
      <Appbar title={capitalize(community.name)} position={'flex-start'} />
      {tiles.length === 0 ? (
        <Spinner description='Connecting to peers'/>
      ) : (
        <FlatList
          data={tiles}
          keyExtractor={item => item.name}
          renderItem={({ item }) => <ChannelTile {...item} />}
          style={{ backgroundColor: defaultTheme.palette.background.white }}
        />
      )}
    </View>
  )
}

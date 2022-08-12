import React, { FC } from 'react'
import { FlatList, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { ChannelTile } from '../ChannelTile/ChannelTile.component'
import { ChannelListProps } from './ChannelList.types'

export const ChannelList: FC<ChannelListProps> = ({ tiles }) => {
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={tiles}
        keyExtractor={item => item.name}
        renderItem={({ item }) => <ChannelTile {...item} />}
        style={{ backgroundColor: defaultTheme.palette.background.white }}
      />
    </View>
  )
}

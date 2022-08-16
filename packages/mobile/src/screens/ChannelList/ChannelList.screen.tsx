import React, { FC, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { View } from 'react-native'
import { publicChannels } from '@quiet/state-manager'
import { initActions } from '../../store/init/init.slice'
import { ChannelList as ChannelListComponent } from '../../components/ChannelList/ChannelList.component'
import { ChannelTileProps } from '../../components/ChannelTile/ChannelTile.types'
import { formatMessageDisplayDate } from '../../utils/functions/formatMessageDisplayDate/formatMessageDisplayDate'
import { replaceScreen } from '../../utils/functions/replaceScreen/replaceScreen'
import { ScreenNames } from '../../const/ScreenNames.enum'

export const ChannelListScreen: FC = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(initActions.setCurrentScreen(ScreenNames.ChannelListScreen))
  })

  const redirect = useCallback((address: string) => {
    dispatch(publicChannels.actions.setCurrentChannel({
      channelAddress: address
    }))
    replaceScreen(ScreenNames.ChannelScreen)
  }, [dispatch])

  const channels = useSelector(publicChannels.selectors.channelsStatus)

  const tiles = Object.values(channels).map(status => {
    const newestMessage = status.newestMessage

    const message = newestMessage?.message
    const date = newestMessage?.createdAt ? formatMessageDisplayDate(newestMessage.createdAt) : undefined

    const tile: ChannelTileProps = {
      name: status.address,
      address: status.address,
      message: message,
      date: date,
      unread: status.unread,
      redirect: redirect
    }

    return tile
  })

  return (
    <View style={{ flex: 1 }}>
      <ChannelListComponent tiles={tiles} />
    </View>
  )
}

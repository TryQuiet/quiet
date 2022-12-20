import React, { FC, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ChannelList as ChannelListComponent } from '../../components/ChannelList/ChannelList.component'
import { ChannelTileProps } from '../../components/ChannelTile/ChannelTile.types'
import { communities, publicChannels } from '@quiet/state-manager'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { formatMessageDisplayDate } from '../../utils/functions/formatMessageDisplayDate/formatMessageDisplayDate'

export const ChannelListScreen: FC = () => {
  const dispatch = useDispatch()

  const redirect = useCallback((address: string) => {
    dispatch(publicChannels.actions.setCurrentChannel({
      channelAddress: address
    }))
    dispatch(navigationActions.navigation({
      screen: ScreenNames.ChannelScreen
     }))
  }, [dispatch])

  const community = useSelector(communities.selectors.currentCommunity)
  const channels = useSelector(publicChannels.selectors.channelsStatusSorted)

  const tiles = channels.map(status => {
    const newestMessage = status.newestMessage

    const message = newestMessage?.message || '...'
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
    <ChannelListComponent community={community} tiles={tiles} />
  )
}

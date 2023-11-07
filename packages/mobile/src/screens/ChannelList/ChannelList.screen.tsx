import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, publicChannels } from '@quiet/state-manager'

import { ChannelList as ChannelListComponent } from '../../components/ChannelList/ChannelList.component'
import { ChannelTileProps } from '../../components/ChannelTile/ChannelTile.types'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'

import { formatMessageDisplayDate } from '../../utils/functions/formatMessageDisplayDate/formatMessageDisplayDate'

import { useContextMenu } from '../../hooks/useContextMenu'
import { MenuName } from '../../const/MenuNames.enum'
import { getChannelNameFormChannelId } from '@quiet/common'
import { initSelectors } from '../../store/init/init.selectors'

export const ChannelListScreen: FC = () => {
  const dispatch = useDispatch()

  /* 
   * Notify user about incoming lack of backwards compatiblity.
   * This should be removed in the next major release of the application (2.x)
   * 
   * https://github.com/TryQuiet/quiet/issues/1980
   */
  useEffect(() => {
    dispatch(navigationActions.navigation({ screen: ScreenNames.NotifierScreen }))
  }, [])

  const redirect = useCallback(
    (id: string) => {
      dispatch(
        publicChannels.actions.setCurrentChannel({
          channelId: id,
        })
      )
      dispatch(
        navigationActions.navigation({
          screen: ScreenNames.ChannelScreen,
        })
      )
    },
    [dispatch]
  )

  const community = useSelector(communities.selectors.currentCommunity)
  const channelsStatusSorted = useSelector(publicChannels.selectors.channelsStatusSorted)

  const tiles = channelsStatusSorted.map(status => {
    const newestMessage = status.newestMessage
    const message = newestMessage?.message || '...'
    const date = newestMessage?.createdAt ? formatMessageDisplayDate(newestMessage.createdAt) : undefined

    const tile: ChannelTileProps = {
      name: getChannelNameFormChannelId(status.id),
      id: status.id,
      message,
      date,
      unread: status.unread,
      redirect,
    }

    return tile
  })

  const ready = useSelector(initSelectors.ready)

  let communityContextMenu = useContextMenu(MenuName.Community)

  if (!ready) {
    // @ts-expect-error
    communityContextMenu = null
  }

  return <ChannelListComponent community={community} tiles={tiles} communityContextMenu={communityContextMenu} />
}

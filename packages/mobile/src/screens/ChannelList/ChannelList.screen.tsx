import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, identity, publicChannels } from '@quiet/state-manager'
import { getChannelNameFromChannelId } from '@quiet/common'

import { ChannelList as ChannelListComponent } from '../../components/ChannelList/ChannelList.component'
import { ChannelTileProps } from '../../components/ChannelTile/ChannelTile.types'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { DateTime } from 'luxon'
import { useContextMenu } from '../../hooks/useContextMenu'
import { MenuName } from '../../const/MenuNames.enum'

export const ChannelListScreen: FC = () => {
  const dispatch = useDispatch()

  const usernameTaken = useSelector(identity.selectors.usernameTaken)

  useEffect(() => {
    if (usernameTaken) {
      dispatch(
        navigationActions.navigation({
          screen: ScreenNames.UsernameTakenScreen,
        })
      )
    }
  }, [dispatch, usernameTaken])

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

  const formatTileDate = (createdAt: number): string => {
    const tzOffsetHours = -new Date().getTimezoneOffset() / 60
    const formattedOffset = `UTC${tzOffsetHours >= 0 ? '+' : ''}${tzOffsetHours}`

    const messageTime = DateTime.fromSeconds(createdAt).setZone(formattedOffset)
    const now = DateTime.now().setZone(formattedOffset)

    // Same year?
    if (messageTime.year === now.year) {
      // Today?
      if (messageTime.hasSame(now, 'day')) {
        return messageTime.toLocaleString(DateTime.TIME_SIMPLE)
      }
      // Yesterday?
      if (messageTime.hasSame(now.minus({ days: 1 }), 'day')) {
        return 'Yesterday'
      }
    }

    // Otherwise just return a date/time in the same zone
    return messageTime.toLocaleString()
  }

  const community = useSelector(communities.selectors.currentCommunity)

  const channelsStatusSorted = useSelector(publicChannels.selectors.channelsStatusSorted)

  const tiles = channelsStatusSorted.map(status => {
    const newestMessage = status.newestMessage

    const message = newestMessage?.message || '...'
    const date = newestMessage?.createdAt ? formatTileDate(newestMessage.createdAt) : undefined

    const tile: ChannelTileProps = {
      name: getChannelNameFromChannelId(status.id),
      isPublic: status.public,
      id: status.id,
      message,
      date,
      unread: status.unread,
      redirect,
    }

    return tile
  })

  const communityContextMenu = useContextMenu(MenuName.Community)

  return <ChannelListComponent community={community} tiles={tiles} communityContextMenu={communityContextMenu} />
}

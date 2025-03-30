import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, identity, users, publicChannels } from '@quiet/state-manager'
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
  const duplicateCerts = useSelector(users.selectors.duplicateCerts)

  useEffect(() => {
    if (usernameTaken) {
      dispatch(
        navigationActions.navigation({
          screen: ScreenNames.UsernameTakenScreen,
        })
      )
    }

    if (duplicateCerts) {
      dispatch(
        navigationActions.navigation({
          screen: ScreenNames.PossibleImpersonationAttackScreen,
        })
      )
    }
  }, [dispatch, usernameTaken, duplicateCerts])

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
    // Extract timezone offset from native Date API and convert it to Luxon's format because Luxon cannot see it in React Native on Android
    // TODO: check to make sure the operations on the Date object below that do not use Luxon successfully consider "this year" and "yesterday" in terms of the local timezone!
    const tzOffsetHours = -new Date().getTimezoneOffset() / 60
    const formattedOffset = `UTC${tzOffsetHours >= 0 ? '+' : ''}${tzOffsetHours}`

    const messageDate = new Date(createdAt * 1000)
    const now = new Date()
    // Check if message was sent within the same year and month.
    if (messageDate.getFullYear() === now.getFullYear()) {
      // Check if message was sent yesterday
      if (messageDate.getDay() + 1 === now.getDay()) {
        return 'Yesterday'
      }
      // Check if message was sent today.
      if (messageDate.getMonth() === now.getMonth() && messageDate.getDay() === now.getDay()) {
        return DateTime.fromSeconds(createdAt).setZone(formattedOffset).toLocaleString(DateTime.TIME_SIMPLE)
      }
    }
    return DateTime.fromSeconds(createdAt).setZone(formattedOffset).toLocaleString()
  }

  const community = useSelector(communities.selectors.currentCommunity)

  const channelsStatusSorted = useSelector(publicChannels.selectors.channelsStatusSorted)

  const tiles = channelsStatusSorted.map(status => {
    const newestMessage = status.newestMessage

    const message = newestMessage?.message || '...'
    const date = newestMessage?.createdAt ? formatTileDate(newestMessage.createdAt) : undefined

    const tile: ChannelTileProps = {
      name: getChannelNameFromChannelId(status.id),
      id: status.id,
      message,
      date,
      unread: status.unread,
      redirect,
    }

    return tile
  })

  const communityContextMenu = useContextMenu(MenuName.Community)

  const handleDebugPress = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.LocaleDebugScreen,
      })
    )
  }, [dispatch])

  return (
    <ChannelListComponent
      community={community}
      tiles={tiles}
      communityContextMenu={communityContextMenu}
      onDebugPress={handleDebugPress}
    />
  )
}

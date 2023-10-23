import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, identity, users, publicChannels } from '@quiet/state-manager'
import { getChannelNameFromChannelId } from '@quiet/common'

import { ChannelList as ChannelListComponent } from '../../components/ChannelList/ChannelList.component'
import { ChannelTileProps } from '../../components/ChannelTile/ChannelTile.types'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'

import { formatMessageDisplayDate } from '../../utils/functions/formatMessageDisplayDate/formatMessageDisplayDate'

import { useContextMenu } from '../../hooks/useContextMenu'
import { MenuName } from '../../const/MenuNames.enum'

export const ChannelListScreen: FC = () => {
  const dispatch = useDispatch()

  const usernameTaken = useSelector(identity.selectors.usernameTaken)
  const duplicateCerts = useSelector(users.selectors.duplicateCerts)
  const allUsers = useSelector(users.selectors.allUsers)

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

  const community = useSelector(communities.selectors.currentCommunity)

  const channelsStatusSorted = useSelector(publicChannels.selectors.channelsStatusSorted)

  const tiles = channelsStatusSorted.map(status => {
    const newestMessage = status.newestMessage

    const message = newestMessage?.message || '...'
    const date = newestMessage?.createdAt ? formatMessageDisplayDate(newestMessage.createdAt) : undefined
    const pubKey = newestMessage?.pubKey
    let nickname = ''
    if (pubKey) {
      nickname = allUsers[newestMessage?.pubKey]?.username
    }

    const tile: ChannelTileProps = {
      name: getChannelNameFromChannelId(status.id),
      id: status.id,
      message,
      date,
      unread: status.unread,
      redirect,
      nickname,
    }

    return tile
  })

  const communityContextMenu = useContextMenu(MenuName.Community)

  return <ChannelListComponent community={community} tiles={tiles} communityContextMenu={communityContextMenu} />
}

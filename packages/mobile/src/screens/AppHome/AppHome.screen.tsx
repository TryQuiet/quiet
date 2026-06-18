import React, { FC, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, identity, network, publicChannels, users } from '@quiet/state-manager'
import { getChannelNameFromChannelId } from '@quiet/common'

import { AppHome } from '../../components/AppHome/AppHome.component'
import { ChannelTileProps } from '../../components/ChannelTile/ChannelTile.types'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { useContextMenu } from '../../hooks/useContextMenu'
import { MenuName } from '../../const/MenuNames.enum'
import { ChannelType, EMPTY_CHANNEL_ID } from '@quiet/types'
import { createLogger } from '../../utils/logger'
import { getUserData } from '../../components/ProfilePhoto/ProfilePhotoWithBadge.component'

const logger = createLogger('AppHomeScreen')

export const AppHomeScreen: FC = () => {
  const dispatch = useDispatch()

  const usernameTaken = useSelector(identity.selectors.usernameTaken)

  const [channelTiles, setChannelTiles] = useState<ChannelTileProps[]>([])
  const [dmTiles, setDmTiles] = useState<ChannelTileProps[]>([])

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
    (id: string, newChat = false) => {
      dispatch(
        publicChannels.actions.setCurrentChannel({
          channelId: id,
        })
      )
      dispatch(
        publicChannels.actions.setNewMessageOpen({
          isOpen: newChat,
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

  const redirectOtherScreen = useCallback(
    (screen: ScreenNames) => {
      dispatch(
        navigationActions.navigation({
          screen,
        })
      )
    },
    [dispatch]
  )

  const community = useSelector(communities.selectors.currentCommunity)

  const channelsStatus = useSelector(publicChannels.selectors.channelsStatus)

  const userProfiles = useSelector(users.selectors.userProfiles)

  const me = useSelector(users.selectors.myUserProfile)

  const connectedPeers = useSelector(network.selectors.connectedPeers)

  const dmChannels = useSelector(publicChannels.selectors.sortedDmChannels)

  const channels = useSelector(publicChannels.selectors.sortedChannels)

  useEffect(() => {
    const newChannelTiles: ChannelTileProps[] = []
    const newDmTitles: ChannelTileProps[] = []
    channels.forEach(channel => {
      if (channel.type === ChannelType.CHANNEL) {
        const status = channelsStatus[channel.id]
        const tile: ChannelTileProps = {
          name: channel.displayedName ?? getChannelNameFromChannelId(channel.id),
          isPublic: channel.public ?? true,
          id: channel.id,
          unread: status?.unread ?? false,
          channelType: ChannelType.CHANNEL,
          redirect,
        }
        newChannelTiles.push(tile)
      }
    })
    dmChannels.forEach(channel => {
      const status = channelsStatus[channel.id]
      const representativeUserData = getUserData(channel, connectedPeers, userProfiles, me)
      const tile: ChannelTileProps = {
        name: channel.displayedName,
        isPublic: false,
        id: channel.id,
        unread: status?.unread ?? false,
        channelType: ChannelType.DM,
        representativeUserData,
        channel,
        redirect,
        me,
      }
      newDmTitles.push(tile)
    })
    setChannelTiles(newChannelTiles)
    setDmTiles(newDmTitles)
  }, [channelsStatus, connectedPeers, userProfiles, me, dmChannels, channels])

  const communityContextMenu = useContextMenu(MenuName.Community)

  const createChannel = () => {
    redirectOtherScreen(ScreenNames.CreateChannelScreen)
  }

  const createDm = () => {
    redirect(EMPTY_CHANNEL_ID, true)
  }

  return (
    <AppHome
      community={community}
      channelTiles={channelTiles}
      dmTiles={dmTiles}
      createChannel={createChannel}
      createDm={createDm}
      communityContextMenu={communityContextMenu}
      userProfiles={userProfiles}
      me={me}
    />
  )
}

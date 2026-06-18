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

  const channelsStatusSorted = useSelector(publicChannels.selectors.channelsStatusSorted)

  const userProfiles = useSelector(users.selectors.userProfiles)

  const me = useSelector(users.selectors.myUserProfile)

  const connectedPeers = useSelector(network.selectors.connectedPeers)

  const dmChannels = useSelector(publicChannels.selectors.dmChannels)

  useEffect(() => {
    const newChannelTiles: ChannelTileProps[] = []
    const newDmTitles: ChannelTileProps[] = []
    channelsStatusSorted.forEach(status => {
      if (status.type === ChannelType.CHANNEL) {
        const tile: ChannelTileProps = {
          name: status.displayedName ?? getChannelNameFromChannelId(status.id),
          isPublic: status.public ?? true,
          id: status.id,
          unread: status.unread,
          channelType: status.type,
          redirect,
        }
        newChannelTiles.push(tile)
      } else if (status.type === ChannelType.DM) {
        const channel = dmChannels.find(channel => channel.id === status.id)
        if (channel == null) {
          logger.error('Channel status was marked as a DM but no DM channel was found')
        }
        const representativeUserData = channel && getUserData(channel, connectedPeers, userProfiles, me)
        const tile: ChannelTileProps = {
          name: status.displayedName ?? '<DM name missing>',
          isPublic: false,
          id: status.id,
          unread: status.unread,
          channelType: status.type,
          representativeUserData,
          channel,
          redirect,
        }
        newDmTitles.push(tile)
      }
    })
    setChannelTiles(newChannelTiles)
    setDmTiles(newDmTitles)
  }, [channelsStatusSorted, connectedPeers, userProfiles, me])

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

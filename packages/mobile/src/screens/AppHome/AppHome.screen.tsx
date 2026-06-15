import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, identity, publicChannels } from '@quiet/state-manager'
import { getChannelNameFromChannelId } from '@quiet/common'

import { AppHome } from '../../components/AppHome/AppHome.component'
import { ChannelTileProps } from '../../components/ChannelTile/ChannelTile.types'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { useContextMenu } from '../../hooks/useContextMenu'
import { MenuName } from '../../const/MenuNames.enum'
import { ChannelType } from '@quiet/types'

export const AppHomeScreen: FC = () => {
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

  const channelTiles: ChannelTileProps[] = []
  const dmTiles: ChannelTileProps[] = []
  channelsStatusSorted.forEach(status => {
    if (status.type === ChannelType.CHANNEL) {
      const tile: ChannelTileProps = {
        name: status.displayedName ?? getChannelNameFromChannelId(status.id),
        isPublic: status.public ?? true,
        id: status.id,
        unread: status.unread,
        redirect,
      }
      channelTiles.push(tile)
    } else if (status.type === ChannelType.DM) {
      const tile: ChannelTileProps = {
        name: status.displayedName ?? 'Null DM Name',
        isPublic: false,
        id: status.id,
        unread: status.unread,
        redirect,
      }
      dmTiles.push(tile)
    }
  })

  const communityContextMenu = useContextMenu(MenuName.Community)

  const createChannel = () => {
    redirectOtherScreen(ScreenNames.CreateChannelScreen)
  }

  const createDm = () => {}

  return (
    <AppHome
      community={community}
      channelTiles={channelTiles}
      dmTiles={dmTiles}
      createChannel={createChannel}
      createDm={createDm}
      communityContextMenu={communityContextMenu}
    />
  )
}

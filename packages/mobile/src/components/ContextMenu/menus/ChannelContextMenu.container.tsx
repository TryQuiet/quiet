import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, publicChannels } from '@quiet/state-manager'

import { navigationSelectors } from '../../../store/navigation/navigation.selectors'

import { useContextMenu } from '../../../hooks/useContextMenu'
import { MenuName } from '../../../const/MenuNames.enum'
import { ContextMenu } from '../ContextMenu.component'
import { ContextMenuItemProps } from '../ContextMenu.types'

import { navigationActions } from '../../../store/navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'

import { capitalizeFirstLetter } from '@quiet/common'

export const ChannelContextMenu: FC = () => {
  const dispatch = useDispatch()

  const screen = useSelector(navigationSelectors.currentScreen)

  const community = useSelector(communities.selectors.currentCommunity)
  const channel = useSelector(publicChannels.selectors.currentChannel)

  let title = ''
  if (channel?.name) {
    title = capitalizeFirstLetter(channel.name)
  }

  const channelContextMenu = useContextMenu(MenuName.Channel)

  const redirect = useCallback(
    (screen: ScreenNames, params: any) => {
      dispatch(
        navigationActions.navigation({
          screen: screen,
          params: params
        })
      )
    },
    [dispatch]
  )

  let items: ContextMenuItemProps[] = []

  if (community?.CA) {
    items = [
      ...items,
      {
        title: 'Delete channel',
        action: () =>
          redirect(ScreenNames.DeleteChannelScreen, {
            channel: channel?.name
          })
      }
    ]
  }

  useEffect(() => {
    channelContextMenu.handleClose()
  }, [screen])

  return <ContextMenu title={title} items={items} {...channelContextMenu} />
}

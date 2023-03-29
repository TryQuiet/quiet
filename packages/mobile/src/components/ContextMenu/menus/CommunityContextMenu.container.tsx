import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities } from '@quiet/state-manager'

import { navigationSelectors } from '../../../store/navigation/navigation.selectors'

import { capitalize } from '../../../utils/functions/capitalize/capitalize'

import { useContextMenu } from '../../../hooks/useContextMenu'
import { MenuName } from '../../../const/MenuNames.enum'
import { ContextMenu } from '../ContextMenu.component'
import { ContextMenuItemProps } from '../ContextMenu.types'

import { navigationActions } from '../../../store/navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'

export const CommunityContextMenu: FC = () => {
  const dispatch = useDispatch()

  const screen = useSelector(navigationSelectors.currentScreen)

  const community = useSelector(communities.selectors.currentCommunity)

  let title = ''
  if (community) {
    title = capitalize(community.name)
  }

  const communityContextMenu = useContextMenu(MenuName.Community)
  const invitationContextMenu = useContextMenu(MenuName.Invitation)

  const redirect = useCallback(
    (screen: ScreenNames) => {
      dispatch(
        navigationActions.navigation({
          screen: screen
        })
      )
    },
    [dispatch]
  )

  const items: ContextMenuItemProps[] = [
    { title: 'Add members', action: () => invitationContextMenu.handleOpen() },
    { title: 'Leave community', action: () => redirect(ScreenNames.LeaveCommunityScreen) }
  ]

  useEffect(() => {
    communityContextMenu.handleClose()
  }, [screen, invitationContextMenu.visible])

  return <ContextMenu title={title} items={items} {...communityContextMenu} />
}

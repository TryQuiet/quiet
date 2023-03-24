import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { navigationSelectors } from '../../../store/navigation/navigation.selectors'

import { useContextMenu } from '../../../hooks/useContextMenu'
import { MenuName } from '../../../const/MenuNames.enum'
import { ContextMenu } from '../ContextMenu.component'
import { ContextMenuItemProps } from '../ContextMenu.types'

import { navigationActions } from '../../../store/navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'

export const InvitationContextMenu: FC = () => {
  const dispatch = useDispatch()

  const screen = useSelector(navigationSelectors.currentScreen)

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
    { title: 'Copy link', action: () => {} },
    { title: 'Cancel', action: () => invitationContextMenu.handleClose() }
  ]

  useEffect(() => {
    invitationContextMenu.handleClose()
  }, [screen])

  return <ContextMenu title={'Add members'} items={items} {...invitationContextMenu} />
}

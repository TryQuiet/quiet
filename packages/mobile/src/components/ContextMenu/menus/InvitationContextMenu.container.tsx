import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Clipboard from '@react-native-clipboard/clipboard'

import { communities } from '@quiet/state-manager'

import { navigationSelectors } from '../../../store/navigation/navigation.selectors'

import { useConfirmationBox } from '../../../hooks/useConfirmationBox'
import { useContextMenu } from '../../../hooks/useContextMenu'
import { MenuName } from '../../../const/MenuNames.enum'
import { ContextMenu } from '../ContextMenu.component'
import { ContextMenuItemProps } from '../ContextMenu.types'

import { navigationActions } from '../../../store/navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'

export const InvitationContextMenu: FC = () => {
  const dispatch = useDispatch()

  const screen = useSelector(navigationSelectors.currentScreen)

  const community = useSelector(communities.selectors.currentCommunity)

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

  const copyLink = async () => {
    Clipboard.setString(`quiet://?code=${community?.registrarUrl}`)
    await confirmationBox.flash()
  }

  const confirmationBox = useConfirmationBox('Link copied')

  const items: ContextMenuItemProps[] = [
    {
      title: 'Copy link',
      action: copyLink
    },
    { title: 'Cancel', action: () => invitationContextMenu.handleClose() }
  ]

  useEffect(() => {
    invitationContextMenu.handleClose()
  }, [screen])

  return (
    <ContextMenu
      title={'Add members'}
      items={items}
      hint={
        'Anyone with Quiet app can follow this link to join this community. Only share with people you trust.'
      }
      link={`quiet://?code=${community?.registrarUrl}`}
      linkAction={copyLink}
      {...invitationContextMenu}
    />
  )
}

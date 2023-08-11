import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Share } from 'react-native'

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

  // const community = useSelector(communities.selectors.currentCommunity)
  const invitationLink = useSelector(communities.selectors.invitationUrl)

  const invitationContextMenu = useContextMenu(MenuName.Invitation)

  const redirect = useCallback(
    (screen: ScreenNames) => {
      dispatch(
        navigationActions.navigation({
          screen,
        })
      )
    },
    [dispatch]
  )

  const copyLink = async () => {
    Clipboard.setString(invitationLink)
    await confirmationBox.flash()
  }

  const shareLink = async () => {
    try {
      await Share.share({
        title: '"Quiet" invitation',
        message: `Chat with me on "Quiet"!\n${invitationLink}`,
      })
    } catch (error) {
      console.error(error)
    }
  }

  const confirmationBox = useConfirmationBox('Link copied')

  const items: ContextMenuItemProps[] = [
    {
      title: 'Copy link',
      action: copyLink,
    },
    {
      title: 'QR code',
      action: () => redirect(ScreenNames.QRCodeScreen),
    },
    {
      title: 'Share',
      action: shareLink,
    },
    {
      title: 'Cancel',
      action: () => invitationContextMenu.handleClose(),
    },
  ]

  useEffect(() => {
    invitationContextMenu.handleClose()
  }, [screen])

  return (
    <ContextMenu
      title={'Add members'}
      items={items}
      hint={'Anyone with Quiet app can follow this link to join this community. Only share with people you trust.'}
      link={invitationLink}
      linkAction={copyLink}
      {...invitationContextMenu}
    />
  )
}

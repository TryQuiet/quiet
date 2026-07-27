import React, { type FC, useCallback, useEffect } from 'react'
import { Platform, Share } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { useDispatch, useSelector } from 'react-redux'

import { connection } from '@quiet/state-manager'

import { MenuName } from '../../../const/MenuNames.enum'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { useConfirmationBox } from '../../../hooks/useConfirmationBox'
import { useContextMenu } from '../../../hooks/useContextMenu'
import { navigationSelectors } from '../../../store/navigation/navigation.selectors'
import { navigationActions } from '../../../store/navigation/navigation.slice'
import { createLogger } from '../../../utils/logger'
import { ContextMenu } from '../ContextMenu.component'
import type { ContextMenuItemProps } from '../ContextMenu.types'

const logger = createLogger('linkedDevicesContextMenu:container')

export const LinkedDevicesContextMenu: FC = () => {
  const dispatch = useDispatch()
  const screen = useSelector(navigationSelectors.currentScreen)
  const deviceLink = useSelector(connection.selectors.deviceLinkUrl)
  const deviceLinkInvite = useSelector(connection.selectors.deviceLinkInvite)
  const linkedDevicesContextMenu = useContextMenu(MenuName.LinkedDevices)
  const confirmationBox = useConfirmationBox('Link copied')

  useEffect(() => {
    if (!linkedDevicesContextMenu.visible) return

    dispatch(connection.actions.setDeviceLinkInvite(undefined))
    dispatch(connection.actions.createDeviceLink())
  }, [dispatch, linkedDevicesContextMenu.visible])

  useEffect(() => {
    linkedDevicesContextMenu.handleClose()
  }, [screen])

  const redirect = useCallback(
    (nextScreen: ScreenNames) => {
      dispatch(
        navigationActions.navigation({
          screen: nextScreen,
        })
      )
    },
    [dispatch]
  )

  const copyLink = async () => {
    if (!deviceLink) return

    Clipboard.setString(deviceLink)
    // Android 33+ already confirms copied content.
    if (Platform.OS === 'android' && Platform.Version >= 33) return
    await confirmationBox.flash()
  }

  const shareLink = async () => {
    if (!deviceLink) return

    try {
      await Share.share({
        title: 'Quiet device link',
        message: `Link this device to my Quiet community:\n${deviceLink}`,
      })
    } catch (error) {
      logger.error(error)
    }
  }

  const items: ContextMenuItemProps[] = [
    {
      title: 'Copy link',
      action: copyLink,
    },
    {
      title: 'QR code',
      action: () => redirect(ScreenNames.LinkedDeviceQRCodeScreen),
    },
    {
      title: 'Share',
      action: shareLink,
    },
    {
      title: 'Cancel',
      action: linkedDevicesContextMenu.handleClose,
    },
  ]

  if (!deviceLink) {
    return (
      <ContextMenu
        title='Linked devices'
        items={[]}
        hint={
          deviceLinkInvite
            ? 'A device link needs an active community connection. Close this menu and try again when connected.'
            : 'Generating device link...'
        }
        {...linkedDevicesContextMenu}
      />
    )
  }

  return (
    <ContextMenu
      title='Linked devices'
      items={items}
      hint='Use this one-time link on another device you control. Keep both devices online until linking finishes. The link expires after 30 minutes.'
      link={deviceLink}
      linkAction={copyLink}
      {...linkedDevicesContextMenu}
    />
  )
}

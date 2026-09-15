import React, { type FC, useCallback, useEffect, useRef } from 'react'
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
  const deviceLinkCreationFailed = useSelector(connection.selectors.deviceLinkCreationFailed)
  const linkedDevicesContextMenu = useContextMenu(MenuName.LinkedDevices)
  const confirmationBox = useConfirmationBox('Link copied')
  const handledCurrentOpen = useRef(false)
  const showedLinkCurrentOpen = useRef(false)
  if (deviceLink) showedLinkCurrentOpen.current = true

  useEffect(() => {
    if (!linkedDevicesContextMenu.visible) {
      handledCurrentOpen.current = false
      showedLinkCurrentOpen.current = false
      return
    }
    if (handledCurrentOpen.current) return

    handledCurrentOpen.current = true
    if (!deviceLinkInvite || deviceLinkInvite.expiresAt <= Date.now()) {
      dispatch(connection.actions.createDeviceLink())
    }
  }, [deviceLinkInvite, dispatch, linkedDevicesContextMenu.visible])

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
          deviceLinkCreationFailed
            ? 'Could not generate a device link. Close this menu and try again.'
            : showedLinkCurrentOpen.current
            ? 'This device link expired. Close and reopen this menu to generate another.'
            : deviceLinkInvite
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
      hint='Anyone with this private link can link another device until it expires in 30 minutes. Keep it secret, and keep both devices online while linking. Expiry blocks new linking but does not remove keys already received by a linked device.'
      link={deviceLink}
      linkAction={copyLink}
      {...linkedDevicesContextMenu}
    />
  )
}

import React, { FC, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NativeModules, Platform } from 'react-native'

import { communities, publicChannels } from '@quiet/state-manager'
import Config from 'react-native-config'

import { navigationSelectors } from '../../../store/navigation/navigation.selectors'

import { useContextMenu } from '../../../hooks/useContextMenu'
import { MenuName } from '../../../const/MenuNames.enum'
import { ContextMenu } from '../ContextMenu.component'
import { ContextMenuItemProps } from '../ContextMenu.types'

import { navigationActions } from '../../../store/navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'

import { capitalizeFirstLetter } from '@quiet/common'
import { pushNotificationsActions } from '../../../store/pushNotifications/pushNotifications.slice'
import { pushNotificationsSelectors } from '../../../store/pushNotifications/pushNotifications.selectors'
import { createLogger } from '../../../utils/logger'
import { NodeEnv } from '../../../utils/const/NodeEnv.enum'
import { sendLogs } from '../../../utils/sendLogs'
import { shareAllData } from '../../../utils/shareAllData'

const logger = createLogger('CommunityContextMenu')

export const CommunityContextMenu: FC = () => {
  const dispatch = useDispatch()

  const [canCreateChannel, setCanCreateChannel] = useState<boolean>(false)

  const screen = useSelector(navigationSelectors.currentScreen)

  const community = useSelector(communities.selectors.currentCommunity)
  const backgroundTorEnabled = useSelector(pushNotificationsSelectors.backgroundTorEnabled)
  const channelPermissions = useSelector(publicChannels.selectors.genericChannelPermissions)

  let title = '...'
  if (community?.name) {
    title = capitalizeFirstLetter(community.name)
  }

  const communityContextMenu = useContextMenu(MenuName.Community)
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

  useEffect(() => {
    setCanCreateChannel(channelPermissions.public.create)
  }, [channelPermissions])

  const toggleBackgroundTor = useCallback(async () => {
    const nextValue = !backgroundTorEnabled

    try {
      await NativeModules.CommunicationModule?.setUserBackgroundTorEnabled?.(nextValue)
      dispatch(pushNotificationsActions.setBackgroundTorEnabled(nextValue))
    } catch (error) {
      logger.error('Failed to update background Tor setting natively', error)
    }
  }, [backgroundTorEnabled, dispatch])

  const items: ContextMenuItemProps[] = [
    { title: 'Add members', action: () => invitationContextMenu.handleOpen() },
    ...(Platform.OS === 'android' && Config.QSS_ALLOWED === 'true' && community?.qssEnabled === true
      ? [
          {
            title: backgroundTorEnabled ? 'Disable background Tor' : 'Enable background Tor',
            action: () => {
              void toggleBackgroundTor()
            },
          } satisfies ContextMenuItemProps,
        ]
      : []),
    { title: 'Leave community', action: () => redirect(ScreenNames.LeaveCommunityScreen) },
  ]

  // if you have permissions to create channels add create channel to the top of the menu
  if (canCreateChannel) {
    items.unshift({ title: 'Create channel', action: () => redirect(ScreenNames.CreateChannelScreen) })
  }

  if (Config.NODE_ENV !== NodeEnv.Production) {
    items.push({
      title: 'Share logs',
      action: () => {
        communityContextMenu.handleClose()
        void sendLogs()
      },
    })
    items.push({
      title: 'Share all data',
      action: () => {
        communityContextMenu.handleClose()
        void shareAllData()
      },
    })
  }

  useEffect(() => {
    communityContextMenu.handleClose()
  }, [screen, invitationContextMenu.visible])

  return <ContextMenu title={title} items={items} {...communityContextMenu} />
}

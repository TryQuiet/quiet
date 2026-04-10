import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NativeModules, Platform } from 'react-native'

import { communities } from '@quiet/state-manager'
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

const logger = createLogger('CommunityContextMenu')

export const CommunityContextMenu: FC = () => {
  const dispatch = useDispatch()

  const screen = useSelector(navigationSelectors.currentScreen)

  const community = useSelector(communities.selectors.currentCommunity)
  const backgroundTorEnabled = useSelector(pushNotificationsSelectors.backgroundTorEnabled)

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
    { title: 'Create channel', action: () => redirect(ScreenNames.CreateChannelScreen) },
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

  useEffect(() => {
    communityContextMenu.handleClose()
  }, [screen, invitationContextMenu.visible])

  return <ContextMenu title={title} items={items} {...communityContextMenu} />
}

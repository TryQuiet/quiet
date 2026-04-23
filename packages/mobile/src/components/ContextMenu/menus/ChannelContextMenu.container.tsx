import React, { FC, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, publicChannels, users } from '@quiet/state-manager'

import { navigationSelectors } from '../../../store/navigation/navigation.selectors'

import { useContextMenu } from '../../../hooks/useContextMenu'
import { MenuName } from '../../../const/MenuNames.enum'
import { ContextMenu } from '../ContextMenu.component'
import { ContextMenuItemProps } from '../ContextMenu.types'

import { navigationActions } from '../../../store/navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import LockIcon from '../../../assets/icons/svg/lock'
import PublicChannelIcon from '../../../assets/icons/svg/public-channel'
import { UserProfile } from '@quiet/types'

export const ChannelContextMenu: FC = () => {
  const dispatch = useDispatch()

  const [memberCountSuffix, setMemberCountSuffx] = useState<string>('')

  const screen = useSelector(navigationSelectors.currentScreen)

  const channel = useSelector(publicChannels.selectors.currentChannel)
  const isOwner = useSelector(communities.selectors.isOwner)
  const userProfiles = useSelector(users.selectors.userProfiles)

  const _initializeData = () => {
    if (channel == null) return
    const membersInChannel: UserProfile[] = Object.values(userProfiles).filter(profile =>
      profile.channels?.includes(channel.id)
    )
    setMemberCountSuffx(`${membersInChannel.length}`)
  }

  let title = ''
  if (channel?.name) {
    title = channel.name
  }

  const channelContextMenu = useContextMenu(MenuName.Channel)

  const redirect = useCallback(
    (screen: ScreenNames, params: any) => {
      dispatch(
        navigationActions.navigation({
          screen,
          params,
        })
      )
    },
    [dispatch]
  )

  useEffect(() => {
    _initializeData()
  }, [userProfiles, screen])

  let items: ContextMenuItemProps[] = []

  if (channel?.public === false) {
    items.push({
      title: isOwner ? 'Permissions' : 'Members in this channel',
      subtitle: isOwner ? 'Members' : undefined,
      suffix: memberCountSuffix,
      action: () =>
        redirect(ScreenNames.ChannelMembershipScreen, {
          channelName: channel?.name,
          channelId: channel?.id,
        }),
    })
  }

  if (isOwner) {
    items = [
      ...items,
      {
        title: 'Delete channel',
        action: () =>
          redirect(ScreenNames.DeleteChannelScreen, {
            channelName: channel?.name,
            channelId: channel?.id,
          }),
      },
    ]
  }

  useEffect(() => {
    channelContextMenu.handleClose()
  }, [screen])

  return (
    <ContextMenu
      title={title}
      titleIcon={channel?.public ?? true ? <PublicChannelIcon /> : <LockIcon fill={true} />}
      items={items}
      {...channelContextMenu}
    />
  )
}

import React, { FC, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { publicChannels, users } from '@quiet/state-manager'

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

const CHANNEL_MEMBERSHIP_ADD_PERMISSIONS_TITLE = 'Permissions'
const CHANNEL_MEMBERSHIP_TITLE = 'Members in this channel'
const CHANNEL_MEMBERSHIP_ADD_PERMISSIONS_SUBTITLE = 'Members'
const CHANNEL_MEMBERSHIP_SUBTITLE = undefined

export const ChannelContextMenu: FC = () => {
  const dispatch = useDispatch()

  const [memberCountSuffix, setMemberCountSuffix] = useState<string>('')
  const [canDelete, setCanDelete] = useState<boolean>(false)
  const [canAddMembers, setCanAddMembers] = useState<boolean>(false)

  const screen = useSelector(navigationSelectors.currentScreen)

  const channel = useSelector(publicChannels.selectors.currentChannel)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const genericChannelPermissions = useSelector(publicChannels.selectors.genericChannelPermissions)
  const currentChannelPermissions = useSelector(publicChannels.selectors.currentChannelPermissions)

  const _initializeData = () => {
    if (channel == null) return
    const membersInChannel: UserProfile[] = Object.values(userProfiles).filter(profile =>
      profile.channels?.includes(channel.id)
    )
    setMemberCountSuffix(`${membersInChannel.length}`)
  }

  let title = ''
  if (channel?.name) {
    title = channel.name
  }

  useEffect(() => {
    if (channel == null) {
      setCanAddMembers(false)
      setCanDelete(false)
      return
    }

    if (channel.public ?? true) {
      setCanAddMembers(false)
      setCanDelete(genericChannelPermissions.public.delete)
    } else {
      if (currentChannelPermissions == null) {
        setCanAddMembers(false)
        setCanDelete(false)
      } else {
        setCanAddMembers(currentChannelPermissions.addMembers)
        setCanDelete(currentChannelPermissions.delete)
      }
    }
  }, [channel, genericChannelPermissions, currentChannelPermissions])

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
  }, [userProfiles])

  let items: ContextMenuItemProps[] = []

  if (channel?.public === false) {
    items.push({
      title: canAddMembers ? CHANNEL_MEMBERSHIP_ADD_PERMISSIONS_TITLE : CHANNEL_MEMBERSHIP_TITLE,
      subtitle: canAddMembers ? CHANNEL_MEMBERSHIP_ADD_PERMISSIONS_SUBTITLE : CHANNEL_MEMBERSHIP_SUBTITLE,
      suffix: memberCountSuffix,
      action: () =>
        redirect(ScreenNames.ChannelMembershipScreen, {
          channelName: channel?.name,
          channelId: channel?.id,
        }),
    })
  }

  if (canDelete) {
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

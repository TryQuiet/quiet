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
import { ChannelType, UserProfile } from '@quiet/types'
import { generateTruncatedDmTitle } from '../../../utils/functions/dmUtils/dmUtils'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('ChannelContextMenu')

const CHANNEL_MEMBERSHIP_ADD_PERMISSIONS_TITLE = 'Permissions'
const CHANNEL_MEMBERSHIP_TITLE = 'Members in this channel'
const CHANNEL_MEMBERSHIP_ADD_PERMISSIONS_SUBTITLE = 'Members'
const CHANNEL_MEMBERSHIP_SUBTITLE = undefined

export const ChannelContextMenu: FC = () => {
  const dispatch = useDispatch()

  const [memberCountSuffix, setMemberCountSuffix] = useState<string>('')
  const [canDelete, setCanDelete] = useState<boolean>(false)
  const [canAddMembers, setCanAddMembers] = useState<boolean>(false)
  const [title, setTitle] = useState<string>('')

  const screen = useSelector(navigationSelectors.currentScreen)

  const channel = useSelector(publicChannels.selectors.currentChannel)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const genericChannelPermissions = useSelector(publicChannels.selectors.genericChannelPermissions)
  const currentChannelPermissions = useSelector(publicChannels.selectors.currentChannelPermissions)

  const _initializeData = () => {
    if (channel == null) return
    const membersInChannel: UserProfile[] = Object.values(userProfiles).filter(profile =>
      channel.type === ChannelType.DM
        ? channel.memberIds?.includes(profile.userId)
        : profile.channels?.includes(channel.id)
    )
    setMemberCountSuffix(`${membersInChannel.length}`)
  }

  useEffect(() => {
    if (channel?.displayedName) {
      const resolvedTitle =
        (channel.type ?? ChannelType.CHANNEL) === ChannelType.CHANNEL
          ? channel.displayedName
          : generateTruncatedDmTitle(channel.displayedName)
      setTitle(resolvedTitle)
    }
  }, [channel])

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
  }, [userProfiles, channel])

  let items: ContextMenuItemProps[] = []

  if (channel?.public === false) {
    const isPrivateChannelOwner = canAddMembers && channel.type !== ChannelType.DM
    const itemTitle = isPrivateChannelOwner
      ? 'Permissions'
      : channel.type !== ChannelType.DM
      ? 'Members in this channel'
      : 'Members in this DM'
    const subtitle = isPrivateChannelOwner ? 'Members' : undefined
    items.push({
      title: itemTitle,
      subtitle,
      suffix: memberCountSuffix,
      action: () =>
        redirect(ScreenNames.ChannelMembershipScreen, {
          channelTitle: title,
          channelName: channel?.displayedName,
          channelId: channel?.id,
          channelType: channel?.type ?? ChannelType.CHANNEL,
        }),
    })
  }

  if (canDelete && channel?.type !== ChannelType.DM) {
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
      titleIcon={
        channel?.type === ChannelType.DM ? (
          <></>
        ) : channel?.public ?? true ? (
          <PublicChannelIcon />
        ) : (
          <LockIcon fill={true} />
        )
      }
      items={items}
      {...channelContextMenu}
    />
  )
}

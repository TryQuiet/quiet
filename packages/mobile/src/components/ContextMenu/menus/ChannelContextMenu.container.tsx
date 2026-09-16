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

const PERMISSIONS_TITLE = 'Permissions'
const PERMISSIONS_SUBTITLE = 'Members'
const MEMBERS_IN_CHANNEL_TITLE = 'Members in this channel'
const MEMBERS_IN_DM_TITLE = 'Members in this DM'

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
    // A profile carries only the private channels it belongs to, because everyone in the community
    // is in every public one — so a public channel's membership is the whole community.
    const membersInChannel: UserProfile[] =
      channel.type === ChannelType.DM
        ? Object.values(userProfiles).filter(profile => channel.memberIds?.includes(profile.userId))
        : (channel.public ?? true)
        ? Object.values(userProfiles)
        : Object.values(userProfiles).filter(profile => profile.channels?.includes(channel.id))
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

  if (channel != null) {
    const isDm = channel.type === ChannelType.DM
    const openMembership = (manageMembership: boolean) => () =>
      redirect(ScreenNames.ChannelMembershipScreen, {
        channelTitle: title,
        channelName: channel?.displayedName,
        channelId: channel?.id,
        channelType: channel?.type ?? ChannelType.CHANNEL,
        manageMembership,
      })

    // Which entry you get turns on whether you are an admin, not on whether the channel is
    // private: an admin manages who belongs here, everyone else only sees who does (Figma
    // PVQ1Kjf6Cq8ng1czuVtvR8, 838:9190). A DM's membership is fixed at creation, so it is always
    // the read-only entry.
    if (canAddMembers && !isDm) {
      items.push({
        title: PERMISSIONS_TITLE,
        // The design's subtitle is "Roles and members"; there are no roles yet.
        subtitle: PERMISSIONS_SUBTITLE,
        suffix: memberCountSuffix,
        action: openMembership(true),
      })
    } else {
      items.push({
        title: isDm ? MEMBERS_IN_DM_TITLE : MEMBERS_IN_CHANNEL_TITLE,
        suffix: memberCountSuffix,
        action: openMembership(false),
      })
    }
  }

  if (canDelete && channel?.type !== ChannelType.DM) {
    items = [
      ...items,
      {
        title: 'Delete channel',
        // Red in the designs, as the one destructive entry in the menu.
        destructive: true,
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

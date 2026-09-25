import React, { FC, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import { communities, publicChannels, users } from '@quiet/state-manager'

import { useContextMenu } from '../../../../hooks/useContextMenu'
import { MenuName } from '../../../../const/MenuNames.enum'
import { ContextMenu, ContextMenuItemList } from '../ContextMenu.component'
import DebugChannelComponent from '../../debugInfo/debugChannelComponent'
import { ContextMenuItemProps } from '../ContextMenu.types'

import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { exportChats } from '../../../../utils/functions/exportMessages'
import ChannelTypeIcon from '../../widgets/channels/ChannelTypeIcon'
import { ChannelType, PublicChannelStorage, UserProfile } from '@quiet/types'
import DMProfilePhoto from '../../widgets/channels/DMProfilePhoto'
import { getChannelMembers, isDefined } from '@quiet/common'
import {
  MEMBERS_IN_CHANNEL_TITLE,
  MEMBERS_IN_DM_TITLE,
} from '../../Channel/ChannelMembership/ChannelMembershipComponent'

export const ChannelContextMenu: FC = () => {
  const [showDebug, setShowDebug] = useState<boolean>(false)
  const [canDelete, setCanDelete] = useState<boolean>(false)

  const channel = useSelector(publicChannels.selectors.currentChannel)
  const channelMessages = useSelector(publicChannels.selectors.currentChannelMessagesMergedBySender)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const me = useSelector(users.selectors.myUserProfile)
  const genericChannelPermissions = useSelector(publicChannels.selectors.genericChannelPermissions)
  const currentChannelPermissions = useSelector(publicChannels.selectors.currentChannelPermissions)

  let title = ''
  if (channel) {
    title = `${channel.displayedName}`
  }

  const memberCount = useMemo(() => getChannelMembers(channel, userProfiles).length, [channel, userProfiles])

  const channelContextMenu = useContextMenu(MenuName.Channel)

  const deleteChannelModal = useModal(ModalName.deleteChannel)
  const channelMembershipModal = useModal(ModalName.channelMembership)

  const items: ContextMenuItemProps[] = []

  useEffect(() => {
    if (channel == null) {
      setCanDelete(false)
      return
    }

    if (channel.public ?? true) {
      setCanDelete(genericChannelPermissions.public.delete)
    } else {
      // A private channel with no permissions in state yet is treated as one you may not delete.
      setCanDelete(currentChannelPermissions?.delete ?? false)
    }
  }, [channel, genericChannelPermissions, currentChannelPermissions])

  // One membership row for everyone, carrying the member count. Whether you can change who belongs
  // is revealed inside the panel by the Add members button, not by the row's name — which also
  // stops the row renaming itself depending on who is looking.
  //
  // The design's channel panel (Figma PVQ1Kjf6Cq8ng1czuVtvR8, 838:9386) draws two rows instead:
  // "Members in this channel" at 3, and "Permissions" — subtitle "Roles and members" — at 6,
  // because there membership governs roles as well as people. Ours governs only people, so the two
  // would carry the same count and "Permissions" would promise a capability that is not there.
  // WHEN ROLES SHIP, split this back into two rows and restore the design's naming; the Storybook
  // story "Channel menu / As designed" holds that version so the intent is not lost meanwhile.
  if (channel != null) {
    const isDm = channel.type === ChannelType.DM
    items.push({
      title: isDm ? MEMBERS_IN_DM_TITLE : MEMBERS_IN_CHANNEL_TITLE,
      suffix: `${memberCount}`,
      action: () => {
        channelContextMenu.handleClose() // Dismiss context menu before displaying the panel
        channelMembershipModal.handleOpen()
      },
    })
  }

  if (canDelete) {
    items.push({
      title: 'Delete channel',
      // Red in the designs, as the one destructive entry in the panel.
      destructive: true,
      action: () => {
        channelContextMenu.handleClose() // Dismiss context menu before displaying modal
        deleteChannelModal.handleOpen()
      },
    })
  }

  items.push({
    title: 'Export messages',
    action: () => channel && exportChats(channel?.name, channelMessages),
  })

  if (process.env.NODE_ENV === 'development') {
    items.push({
      title: 'Debug',
      action: () => setShowDebug(true),
    })
  }

  const TitleIcon: FC<{
    channel: PublicChannelStorage | undefined
    me: UserProfile | undefined
    userProfiles: Record<string, UserProfile>
  }> = ({ channel, me, userProfiles }) => {
    if (channel == null) {
      return <></>
    }
    if (channel.type == null || channel.type === ChannelType.CHANNEL) {
      return (
        <ChannelTypeIcon
          isPublic={channel?.public ?? true}
          fill={'currentColor'}
          style={{ fontSize: 16 }}
          data-testid={`contextMenu-channel-settings-type-icon`}
        />
      )
    }

    const members = channel.memberIds?.map(memberId => userProfiles[memberId]).filter(isDefined) ?? []
    return <DMProfilePhoto me={me} members={members} />
  }

  return showDebug ? (
    <ContextMenu
      title={title + ' Debug'}
      titleIcon={<TitleIcon channel={channel} me={me} userProfiles={userProfiles} />}
      {...channelContextMenu}
      handleBack={() => setShowDebug(false)}
    >
      <DebugChannelComponent />
    </ContextMenu>
  ) : (
    <ContextMenu
      title={title}
      titleIcon={<TitleIcon channel={channel} me={me} userProfiles={userProfiles} />}
      {...channelContextMenu}
    >
      <ContextMenuItemList items={items} />
    </ContextMenu>
  )
}

export default ChannelContextMenu

import React, { FC, useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'

import { connection, publicChannels, users } from '@quiet/state-manager'
import { ChannelType } from '@quiet/types'
import { getChannelMembers } from '@quiet/common'

import { useModal } from '../../../containers/hooks'
import { useContextMenu } from '../../../../hooks/useContextMenu'
import { MenuName } from '../../../../const/MenuNames.enum'
import { UserProfileContextMenuArgs } from '../../ContextMenu/menus/UserProfileContextMenu.container'
import { ModalName } from '../../../sagas/modals/modals.types'
import ChannelMembershipComponent from './ChannelMembershipComponent'

export const ChannelMembership: FC = () => {
  const modal = useModal(ModalName.channelMembership)
  const userProfileContextMenu = useContextMenu<UserProfileContextMenuArgs>(MenuName.UserProfile)
  const addMembersModal = useModal(ModalName.addMembersChannel)

  const channel = useSelector(publicChannels.selectors.currentChannel)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const isUserConnected = useSelector(connection.selectors.isUserConnected)
  const isTorInitialized = useSelector(connection.selectors.isTorInitialized)
  const myUserProfile = useSelector(users.selectors.myUserProfile)
  const currentChannelPermissions = useSelector(publicChannels.selectors.currentChannelPermissions)

  const canManage = currentChannelPermissions?.addMembers ?? false

  const members = useMemo(() => getChannelMembers(channel, userProfiles), [channel, userProfiles])

  const openAddMembers = useCallback(() => {
    modal.handleClose() // Dismiss this panel before displaying the next
    addMembersModal.handleOpen()
  }, [modal, addMembersModal])

  if (!channel) return null

  // A DM has no name of its own; it is named by who is in it, which is what displayedName holds —
  // the same source the channel menu's title uses, so the two cannot disagree.
  const isDm = channel.type === ChannelType.DM

  return (
    <ChannelMembershipComponent
      channelName={isDm ? channel.displayedName : channel.name}
      isDm={isDm}
      members={members}
      isUserConnected={isUserConnected}
      myUserId={myUserProfile?.userId}
      isTorInitialized={isTorInitialized}
      canManage={canManage}
      openUserProfile={(userId: string) => {
        modal.handleClose() // Dismiss this panel before displaying the next
        userProfileContextMenu.handleOpen({ userProfile: userProfiles[userId] })
      }}
      openAddMembers={openAddMembers}
      {...modal}
    />
  )
}

export default ChannelMembership

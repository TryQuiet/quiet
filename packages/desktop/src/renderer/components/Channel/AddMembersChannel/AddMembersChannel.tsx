import React, { FC, useCallback } from 'react'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useSelector, useDispatch } from 'react-redux'
import { communities, publicChannels, users } from '@quiet/state-manager'
import AddMembersChannelComponent from './AddMembersChannelComponent'

export const AddMembersChannel: FC = () => {
  const modal = useModal(ModalName.addMembersChannel)

  const channel = useSelector(publicChannels.selectors.currentChannel)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const allUsers = useSelector(users.selectors.allUsers)

  const dispatch = useDispatch()

  const addMembersToChannel = useCallback(
    (memberIds: string[]) => {
      if (!channel) return
      if (memberIds.length === 0) return
      modal.handleClose() // Close self
    },
    [modal]
  )

  if (!channel) return null
  if (channel.public) return null

  return (
    <AddMembersChannelComponent
      channelName={channel.name}
      channelId={channel.id}
      possibleMembers={userProfiles}
      allUsers={allUsers}
      addMembersToChannel={addMembersToChannel}
      {...modal}
    />
  )
}

export default AddMembersChannel

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CreateChannelComponent from './CreateChannelComponent'
import {
  communities,
  ErrorCodes,
  ErrorMessages,
  errors,
  identity,
  PublicChannel,
  publicChannels,
  SocketActionTypes
} from '@quiet/state-manager'
import { DateTime } from 'luxon'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { flushSync } from 'react-dom'

export const CreateChannel = () => {
  const dispatch = useDispatch()

  const [newChannel, setNewChannel] = useState<PublicChannel | null>(null)

  const user = useSelector(identity.selectors.currentIdentity)
  if (!user) return null
  const community = useSelector(communities.selectors.currentCommunityId)
  const channels = useSelector(publicChannels.selectors.publicChannels)

  const communityErrors = useSelector(errors.selectors.currentCommunityErrors)
  const error = communityErrors[SocketActionTypes.CREATED_CHANNEL]

  const createChannelModal = useModal(ModalName.createChannel)

  useEffect(() => {
    if (!newChannel) return
    if (
      createChannelModal.open &&
      channels.filter(channel => channel.name === newChannel?.name).length > 0
    ) {
      dispatch(
        publicChannels.actions.setCurrentChannel({
          channelAddress: newChannel.address
        })
      )
      setNewChannel(null)
      createChannelModal.handleClose()
    }
  }, [channels])

  const clearErrors = () => {
    if (error) {
      dispatch(errors.actions.clearError(error))
    }
  }

  const createChannel = (name: string) => {
    // Clear errors
    clearErrors()
    // Validate channel name
    if (channels.some(channel => channel.name === name)) {
      dispatch(
        errors.actions.addError({
          type: SocketActionTypes.CREATED_CHANNEL,
          code: ErrorCodes.FORBIDDEN,
          message: ErrorMessages.CHANNEL_NAME_TAKEN,
          community: community
        })
      )
      return
    }
    // Create channel
    const channel: PublicChannel = {
      name: name,
      description: `Welcome to #${name}`,
      owner: user.nickname,
      address: name,
      timestamp: DateTime.utc().valueOf()
    }
    flushSync(() => {
      // TODO: maybe add a better fix. React 18 does not perform rerenders inside callback functions
      setNewChannel(channel)
    })
    dispatch(
      publicChannels.actions.createChannel({
        channel: channel
      })
    )
  }
  return (
    <>
      {community && (
        <CreateChannelComponent
          {...createChannelModal}
          channelCreationError={error?.message}
          createChannel={createChannel}
          clearErrorsDispatch={clearErrors}
        />
      )}
    </>
  )
}

export default CreateChannel

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CreateChannelComponent from './CreateChannelComponent'
import { communities, errors, identity, publicChannels } from '@quiet/state-manager'
import { ChannelType, CreateChannelPayload, ErrorCodes, ErrorMessages, SocketActions } from '@quiet/types'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { generateChannelId } from '@quiet/common'
import { createLogger } from '../../../logger'

const logger = createLogger('createChannel')

export const CreateChannel = () => {
  const dispatch = useDispatch()

  const [newChannel, setNewChannel] = useState<CreateChannelPayload | null>(null)

  const user = useSelector(identity.selectors.currentIdentity)
  const communityId = useSelector(communities.selectors.currentCommunityId)
  const community = useSelector(communities.selectors.currentCommunity)
  const channels = useSelector(publicChannels.selectors.publicChannels)
  const canCreateChannel = useSelector(publicChannels.selectors.canCreateChannel)
  const canCreatePrivateChannel = useSelector(publicChannels.selectors.canCreatePrivateChannel)

  const communityErrors = useSelector(errors.selectors.currentCommunityErrors)
  const error = communityErrors[SocketActions.CREATE_CHANNEL]

  const createChannelModal = useModal(ModalName.createChannel)

  useEffect(() => {
    if (!newChannel) return
    if (createChannelModal.open && channels.filter(channel => channel.name === newChannel?.name).length > 0) {
      dispatch(
        publicChannels.actions.setCurrentChannel({
          channelId: newChannel.id,
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

  const createChannel = (name: string, isPublic: boolean) => {
    logger.debug(`Creating ${isPublic ? 'public' : 'private'} channel...`)
    // Clear errors
    clearErrors()
    if (!user) {
      logger.error('No identity found')
      dispatch(
        errors.actions.addError({
          type: SocketActions.CREATE_CHANNEL,
          code: ErrorCodes.NOT_FOUND,
          message: ErrorMessages.GENERAL,
          community: communityId,
        })
      )
      return
    }
    logger.debug('Creating channel - checking for duplicate name')
    // Validate channel name
    if (channels.some(channel => channel.name === name)) {
      dispatch(
        errors.actions.addError({
          type: SocketActions.CREATE_CHANNEL,
          code: ErrorCodes.FORBIDDEN,
          message: ErrorMessages.CHANNEL_NAME_TAKEN,
          community: communityId,
        })
      )
      return
    }
    logger.debug('Creating channel - checking for community metadata')
    if (community == null || community.teamId == null) {
      logger.error('Community or team ID was nullish')
      dispatch(
        errors.actions.addError({
          type: SocketActions.CREATE_CHANNEL,
          code: ErrorCodes.NOT_FOUND,
          message: ErrorMessages.COMMUNITY_NOT_INITIALIZED,
          community: communityId,
        })
      )
      return
    }
    logger.debug('Creating channel - executing saga')
    const payload: CreateChannelPayload = {
      id: generateChannelId(name),
      name: name,
      description: `Welcome to #${name}`,
      public: isPublic,
      type: ChannelType.CHANNEL,
      teamId: community.teamId,
    } as CreateChannelPayload
    dispatch(publicChannels.actions.createChannel(payload))
    setNewChannel(payload)
    logger.debug('Creating channel - done')
  }
  return (
    <>
      {canCreateChannel && communityId && (
        <CreateChannelComponent
          {...createChannelModal}
          channelCreationError={error?.message}
          createChannel={createChannel}
          clearErrorsDispatch={clearErrors}
          canCreateChannel={canCreateChannel}
          canCreatePrivateChannel={canCreatePrivateChannel}
        />
      )}
    </>
  )
}

export default CreateChannel

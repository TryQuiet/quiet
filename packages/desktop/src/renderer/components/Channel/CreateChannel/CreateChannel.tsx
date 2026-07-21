import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CreateChannelComponent from './CreateChannelComponent'
import { communities, errors, identity, publicChannels } from '@quiet/state-manager'
import { ChannelType, CreateChannelPayload, ErrorCodes, ErrorMessages, SocketActions } from '@quiet/types'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { createLogger } from '../../../logger'

const logger = createLogger('createChannel')

export const CreateChannel = () => {
  const dispatch = useDispatch()

  const [newChannel, setNewChannel] = useState<CreateChannelPayload | null>(null)
  const [canCreateChannel, setCanCreateChannel] = useState<boolean>(false)
  const [canCreatePrivateChannel, setCanCreatePrivateChannel] = useState<boolean>(false)

  const user = useSelector(identity.selectors.currentIdentity)
  const communityId = useSelector(communities.selectors.currentCommunityId)
  const community = useSelector(communities.selectors.currentCommunity)
  const channels = useSelector(publicChannels.selectors.publicChannels)
  const channelPermissions = useSelector(publicChannels.selectors.genericChannelPermissions)

  const communityErrors = useSelector(errors.selectors.currentCommunityErrors)
  const error = communityErrors[SocketActions.CREATE_CHANNEL]

  const createChannelModal = useModal(ModalName.createChannel)

  useEffect(() => {
    if (!newChannel) return
    const createdChannel = channels.find(channel => channel.name === newChannel.name)
    if (createChannelModal.open && createdChannel != null) {
      dispatch(
        publicChannels.actions.setCurrentChannel({
          channelId: createdChannel.id,
        })
      )
      setNewChannel(null)
      createChannelModal.handleClose()
    }
  }, [channels])

  useEffect(() => {
    setCanCreateChannel(channelPermissions.public.create)
    setCanCreatePrivateChannel(channelPermissions.private.create)
  }, [channelPermissions])

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
    const hasPermission = isPublic ? canCreateChannel : canCreatePrivateChannel
    if (hasPermission == null) {
      logger.error('Channel permissions are nullish')
      dispatch(
        errors.actions.addError({
          type: SocketActions.CREATE_CHANNEL,
          code: ErrorCodes.NOT_FOUND,
          message: ErrorMessages.CHANNEL_PERMISSIONS_NOT_FOUND,
          community: communityId,
        })
      )
      return
    }
    if (!hasPermission) {
      logger.error('User lacks permissions to perform this action')
      dispatch(
        errors.actions.addError({
          type: SocketActions.CREATE_CHANNEL,
          code: ErrorCodes.FORBIDDEN,
          message: ErrorMessages.CHANNEL_PERMISSIONS_INVALID,
          community: communityId,
        })
      )
      return
    }
    const payload = {
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
      {(canCreateChannel || canCreatePrivateChannel) && communityId && (
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

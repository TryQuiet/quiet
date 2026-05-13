import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CreateChannelComponent from './CreateChannelComponent'
import { communities, errors, identity, publicChannels } from '@quiet/state-manager'
import { CreateChannelPayload, ErrorCodes, ErrorMessages, PublicChannel, SocketActions } from '@quiet/types'
import { DateTime } from 'luxon'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { flushSync } from 'react-dom'
import { generateChannelId } from '@quiet/common'
import { createLogger } from '../../../logger'
import { is } from 'ramda'

const logger = createLogger('createChannel')

export const CreateChannel = () => {
  const dispatch = useDispatch()

  const [newChannel, setNewChannel] = useState<CreateChannelPayload | null>(null)

  const user = useSelector(identity.selectors.currentIdentity)
  const communityId = useSelector(communities.selectors.currentCommunityId)
  const community = useSelector(communities.selectors.currentCommunity)
  const channels = useSelector(publicChannels.selectors.publicChannels)

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
    logger.warn(`Creating ${isPublic ? 'public' : 'private'} channel...`)
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
    logger.warn('Creating channel 2...')
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
    logger.warn('Creating channel 3...')
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
    const payload = {
      id: generateChannelId(name),
      name: name,
      description: `Welcome to #${name}`,
      public: isPublic,
      teamId: community.teamId,
    } as CreateChannelPayload
    dispatch(publicChannels.actions.createChannel(payload))
    setNewChannel(payload)
    logger.warn('Creating channel 4...')
  }
  return (
    <>
      {communityId && (
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

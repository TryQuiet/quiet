import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CreateChannelComponent from './CreateChannelComponent'
import { communities, errors, identity, publicChannels } from '@quiet/state-manager'
import { ErrorCodes, ErrorMessages, PublicChannel, SocketActionTypes } from '@quiet/types'
import { DateTime } from 'luxon'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { flushSync } from 'react-dom'
import { generateChannelId } from '@quiet/common'

export const CreateChannel = () => {
    const dispatch = useDispatch()

    const [newChannel, setNewChannel] = useState<PublicChannel | null>(null)

    const user = useSelector(identity.selectors.currentIdentity)
    const community = useSelector(communities.selectors.currentCommunityId)
    const channels = useSelector(publicChannels.selectors.publicChannels)

    const communityErrors = useSelector(errors.selectors.currentCommunityErrors)
    const error = communityErrors[SocketActionTypes.CREATED_CHANNEL]

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

    const createChannel = (name: string) => {
        // Clear errors
        clearErrors()
        if (!user) {
            console.error('No identity found')
            dispatch(
                errors.actions.addError({
                    type: SocketActionTypes.CREATED_CHANNEL,
                    code: ErrorCodes.NOT_FOUND,
                    message: ErrorMessages.GENERAL,
                    community: community,
                })
            )
            return
        }
        // Validate channel name
        if (channels.some(channel => channel.name === name)) {
            dispatch(
                errors.actions.addError({
                    type: SocketActionTypes.CREATED_CHANNEL,
                    code: ErrorCodes.FORBIDDEN,
                    message: ErrorMessages.CHANNEL_NAME_TAKEN,
                    community: community,
                })
            )
            return
        }
        // Move to state manager
        // Create channel
        const channel: PublicChannel = {
            name: name,
            description: `Welcome to #${name}`,
            owner: user.nickname,
            id: generateChannelId(name),
            timestamp: DateTime.utc().valueOf(),
        }
        flushSync(() => {
            // TODO: maybe add a better fix. React 18 does not perform rerenders inside callback functions
            setNewChannel(channel)
        })
        dispatch(
            publicChannels.actions.createChannel({
                channel: channel,
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

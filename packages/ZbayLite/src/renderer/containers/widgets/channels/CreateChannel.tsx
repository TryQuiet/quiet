import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CreateChannelComponent from '../../../components/widgets/channels/CreateChannel/CreateChannel'
import { communities, identity, publicChannels } from '@zbayapp/nectar'
import { DateTime } from 'luxon'
import { useModal } from '../../hooks'
import { ModalName } from '../../../sagas/modals/modals.types'

export const CreateChannel = () => {
  const dispatch = useDispatch()

  const createChannelModal = useModal(ModalName.createChannel)

  const community = useSelector(communities.selectors.currentCommunityId)
  const user = useSelector(identity.selectors.currentIdentity)

  const createChannel = (name: string) => {
    dispatch(
      publicChannels.actions.addChannel({
        channel: {
          name: name,
          description: `Welcome to #${name}`,
          owner: user.zbayNickname,
          address: name,
          timestamp: DateTime.utc().valueOf()
        },
        communityId: community
      })
    )
    dispatch(
      publicChannels.actions.setCurrentChannel({
        channel: name,
        communityId: community
      })
    )
    createChannelModal.handleClose()
  }

  return (
    <>
      {community && (
        <CreateChannelComponent {...createChannelModal} createChannel={createChannel} />
      )}
    </>
  )
}

export default CreateChannel

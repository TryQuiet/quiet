import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CreateChannelComponent from '../../../components/widgets/channels/CreateChannel/CreateChannel'
import { communities, identity, PublicChannel, publicChannels } from '@quiet/nectar'
import { DateTime } from 'luxon'
import { useModal } from '../../hooks'
import { ModalName } from '../../../sagas/modals/modals.types'

export const CreateChannel = () => {
  const dispatch = useDispatch()

  const [newChannel, setNewChannel] = useState<PublicChannel>(null)

  const user = useSelector(identity.selectors.currentIdentity)
  const community = useSelector(communities.selectors.currentCommunityId)
  const channels = useSelector(publicChannels.selectors.publicChannels)

  const createChannelModal = useModal(ModalName.createChannel)

  useEffect(() => {
    if (createChannelModal.open && channels.filter(channel => channel.name === newChannel?.name).length > 0) {
      dispatch(
        publicChannels.actions.setCurrentChannel({
          channel: newChannel.name,
          communityId: community
        })
      )
      setNewChannel(null)
      createChannelModal.handleClose()
    }
  }, [channels])

  const createChannel = (name: string) => {
    const channel: PublicChannel = {
      name: name,
      description: `Welcome to #${name}`,
      owner: user.zbayNickname,
      address: name,
      timestamp: DateTime.utc().valueOf()
    }
    setNewChannel(channel)
    dispatch(
      publicChannels.actions.createChannel({
        channel: channel,
        communityId: community
      })
    )
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

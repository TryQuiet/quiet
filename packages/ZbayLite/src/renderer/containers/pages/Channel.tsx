import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, identity, messages, publicChannels } from '@zbayapp/nectar'

import ChannelComponent from '../../components/pages/Channel'

import { useModal } from '../hooks'
import { ModalName } from '../../sagas/modals/modals.types'

const Channel = () => {
  const dispatch = useDispatch()

  const user = useSelector(identity.selectors.currentIdentity)

  const currentCommunityId = useSelector(communities.selectors.currentCommunityId)

  const allChannels = useSelector(publicChannels.selectors.publicChannels)
  const currentChannelAddress = useSelector(publicChannels.selectors.currentChannel)
  const currentChannel = allChannels.find(channel => channel?.address === currentChannelAddress)

  const currentChannelMessagesCount = useSelector(
    publicChannels.selectors.currentChannelMessagesCount
  )

  const currentChannelDisplayableMessages = useSelector(
    publicChannels.selectors.currentChannelMessagesMergedBySender
  )

  const channelSettingsModal = useModal(ModalName.channelSettingsModal)
  const channelInfoModal = useModal(ModalName.channelInfo)

  const onInputChange = useCallback(
    (_value: string) => {
      // TODO https://github.com/ZbayApp/ZbayLite/issues/442
    },
    [dispatch]
  )

  const onInputEnter = useCallback(
    (message: string) => {
      dispatch(messages.actions.sendMessage(message))
    },
    [dispatch]
  )

  const setChannelLoadingSlice = useCallback(
    (value: number) => {
      dispatch(publicChannels.actions.setChannelLoadingSlice({
        communityId: currentCommunityId,
        slice: value
      }))
    },
    [dispatch, currentCommunityId]
  )

  return (
    <>
      {currentChannel && (
        <ChannelComponent
          user={user}
          channel={currentChannel}
          channelSettingsModal={channelSettingsModal}
          channelInfoModal={channelInfoModal}
          messages={{
            count: currentChannelMessagesCount,
            groups: currentChannelDisplayableMessages
          }}
          setChannelLoadingSlice={setChannelLoadingSlice}
          onDelete={function (): void {}}
          onInputChange={onInputChange}
          onInputEnter={onInputEnter}
          mutedFlag={false}
          notificationFilter={''}
          openNotificationsTab={function (): void {}}
        />
      )}
    </>
  )
}

export default Channel

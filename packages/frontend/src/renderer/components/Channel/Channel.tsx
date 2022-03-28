import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, identity, messages, publicChannels } from '@quiet/nectar'

import ChannelComponent from './ChannelComponent'

import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'

const Channel = () => {
  const dispatch = useDispatch()

  const user = useSelector(identity.selectors.currentIdentity)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentChannel = useSelector(publicChannels.selectors.currentChannel)

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

  const setChannelMessagesSliceValue = useCallback(
    (value: number) => {
      dispatch(
        publicChannels.actions.setChannelMessagesSliceValue({
          messagesSlice: value,
          channelAddress: currentChannel?.address,
          communityId: currentCommunity?.id
        })
      )
    },
    [dispatch, currentChannel?.address, currentCommunity?.id]
  )

  const cacheChannelScrollPosition = useCallback(
    (value: number) => {
      dispatch(
        publicChannels.actions.cacheChannelScrollPosition({
          scrollPosition: value,
          channelAddress: currentChannel?.address,
          communityId: currentCommunity?.id
        })
      )
    },
    [dispatch, currentChannel?.address, currentCommunity?.id]
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
          setChannelMessagesSliceValue={setChannelMessagesSliceValue}
          cacheChannelScrollPosition={cacheChannelScrollPosition}
          onDelete={function (): void { }}
          onInputChange={onInputChange}
          onInputEnter={onInputEnter}
          mutedFlag={false}
          notificationFilter={''}
          openNotificationsTab={function (): void { }}
        />
      )}
    </>
  )
}

export default Channel

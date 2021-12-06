import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { identity, messages, publicChannels } from '@zbayapp/nectar'

import ChannelComponent from '../../components/pages/Channel'

import { useModal } from '../hooks'
import { ModalName } from '../../sagas/modals/modals.types'

const Channel = () => {
  const dispatch = useDispatch()

  const user = useSelector(identity.selectors.currentIdentity)
  const channels = useSelector(publicChannels.selectors.publicChannels)
  const currentChannelAddress = useSelector(publicChannels.selectors.currentChannel)
  const currentChannel = channels.find(channel => channel?.address === currentChannelAddress)
  const displayableMessages = useSelector(
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

  return (
    <>
      {currentChannel && (
        <ChannelComponent
          user={user}
          channel={currentChannel}
          channelSettingsModal={channelSettingsModal}
          channelInfoModal={channelInfoModal}
          messages={displayableMessages}
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

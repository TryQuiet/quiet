import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { identity, messages, publicChannels } from '@quiet/nectar'

import ChannelComponent from './ChannelComponent'

import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'

const Channel = () => {
  const dispatch = useDispatch()

  const user = useSelector(identity.selectors.currentIdentity)

  const currentChannelAddress = useSelector(publicChannels.selectors.currentChannelAddress)
  const currentChannelName = useSelector(publicChannels.selectors.currentChannelName)

  const currentChannelDisplayableMessages = useSelector(
    publicChannels.selectors.currentChannelMessagesMergedBySender
  )

  const pendingMessages = useSelector(
    messages.selectors.messagesSendingStatus
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
      dispatch(messages.actions.sendMessage({ message }))
    },
    [dispatch]
  )

  const lazyLoading = useCallback(
    (load: boolean) => {
      dispatch(messages.actions.lazyLoading({ load }))
    },
    [dispatch]
  )

  console.log('channel rerendered')

  return (
    <>
      {currentChannelAddress && (
        <ChannelComponent
          user={user}
          channelAddress={currentChannelAddress}
          channelName={currentChannelName}
          channelSettingsModal={channelSettingsModal}
          channelInfoModal={channelInfoModal}
          messages={currentChannelDisplayableMessages}
          pendingMessages={pendingMessages}
          lazyLoading={lazyLoading}
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

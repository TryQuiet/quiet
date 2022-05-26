import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { identity, messages, publicChannels, connection, communities } from '@quiet/state-manager'

import ChannelComponent from './ChannelComponent'

import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { FilePreviewData } from '../widgets/channels/UploadedFilesPreviews'

const Channel = () => {
  const dispatch = useDispatch()

  const user = useSelector(identity.selectors.currentIdentity)

  const currentChannelAddress = useSelector(publicChannels.selectors.currentChannelAddress)
  const currentChannelName = useSelector(publicChannels.selectors.currentChannelName)

  const currentChannelMessagesCount = useSelector(
    publicChannels.selectors.currentChannelMessagesCount
  )

  const currentChannelDisplayableMessages = useSelector(
    publicChannels.selectors.currentChannelMessagesMergedBySender
  )

  const communityId = useSelector(communities.selectors.currentCommunityId)
  const initializedCommunities = useSelector(connection.selectors.initializedCommunities)

  const isCommunityInitialized = Boolean(initializedCommunities[communityId])

  const pendingMessages = useSelector(
    messages.selectors.messagesSendingStatus
  )

  const channelSettingsModal = useModal(ModalName.channelSettingsModal)
  const channelInfoModal = useModal(ModalName.channelInfo)

  const onInputChange = useCallback(
    (_value: string) => {
      // TODO https://github.com/TryQuiet/ZbayLite/issues/442
    },
    [dispatch]
  )

  const onInputEnter = useCallback(
    (message: string, files: FilePreviewData) => {
      if (message) {
        dispatch(messages.actions.sendMessage({ message }))
      }
      Object.values(files).forEach(fileData => {
        console.log('Uploading file', fileData)
        dispatch(messages.actions.uploadFile(fileData))
      })
    },
    [dispatch]
  )

  const lazyLoading = useCallback(
    (load: boolean) => {
      dispatch(messages.actions.lazyLoading({ load }))
    },
    [dispatch]
  )

  useEffect(() => {
    dispatch(messages.actions.resetCurrentPublicChannelCache())
  }, [currentChannelAddress])

  return (
    <>
      {currentChannelAddress && (
        <ChannelComponent
          user={user}
          channelAddress={currentChannelAddress}
          channelName={currentChannelName}
          channelSettingsModal={channelSettingsModal}
          channelInfoModal={channelInfoModal}
          messages={{
            count: currentChannelMessagesCount,
            groups: currentChannelDisplayableMessages
          }}
          pendingMessages={pendingMessages}
          lazyLoading={lazyLoading}
          onDelete={function (): void { }}
          onInputChange={onInputChange}
          onInputEnter={onInputEnter}
          mutedFlag={false}
          notificationFilter={''}
          openNotificationsTab={function (): void { }}
          isCommunityInitialized={isCommunityInitialized}
        />
      )}
    </>
  )
}

export default Channel

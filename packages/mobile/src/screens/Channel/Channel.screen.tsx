import React, { FC, useCallback, useEffect, useState } from 'react'
import { BackHandler, Linking } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { Chat } from '../../components/Chat/Chat.component'
import {
  CancelDownload,
  FileMetadata,
  files,
  identity,
  messages,
  publicChannels
} from '@quiet/state-manager'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'

export const ChannelScreen: FC = () => {
  const dispatch = useDispatch()

  const handleBackButton = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.ChannelListScreen
      })
    )
    dispatch(
      publicChannels.actions.setCurrentChannel({
        channelAddress: '' // Necessary for marking channels as unread on channel's list
      })
    )
    return true
  }, [dispatch])

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBackButton)
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackButton)
    }
  }, [handleBackButton])

  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const currentChannel = useSelector(publicChannels.selectors.currentChannel)

  const channelMessagesCount = useSelector(publicChannels.selectors.currentChannelMessagesCount)

  const channelMessages = useSelector(publicChannels.selectors.currentChannelMessagesMergedBySender)

  const pendingMessages = useSelector(messages.selectors.messagesSendingStatus)

  const downloadStatusesMapping = useSelector(files.selectors.downloadStatuses)

  const downloadFile = useCallback(
    (media: FileMetadata) => {
      dispatch(files.actions.downloadFile(media))
    },
    [dispatch]
  )

  const cancelDownload = useCallback(
    (cancelDownload: CancelDownload) => {
      dispatch(files.actions.cancelDownload(cancelDownload))
    },
    [dispatch]
  )

  const sendMessageAction = useCallback(
    (message: string) => {
      dispatch(messages.actions.sendMessage({ message }))
    },
    [dispatch]
  )

  const loadMessages = useCallback(
    (load: boolean) => {
      dispatch(messages.actions.lazyLoading({ load }))
    },
    [dispatch]
  )

  useEffect(() => {
    dispatch(messages.actions.resetCurrentPublicChannelCache())
  }, [currentChannel?.address])

  const [imagePreview, setImagePreview] = useState<FileMetadata>(null)

  const openUrl = useCallback((url: string) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    Linking.openURL(url)
  }, [])

  return (
    <Chat
      sendMessageAction={sendMessageAction}
      loadMessagesAction={loadMessages}
      handleBackButton={handleBackButton}
      channel={currentChannel}
      user={currentIdentity.nickname}
      messages={{
        count: channelMessagesCount,
        groups: channelMessages
      }}
      pendingMessages={pendingMessages}
      downloadStatuses={downloadStatusesMapping}
      downloadFile={downloadFile}
      cancelDownload={cancelDownload}
      imagePreview={imagePreview}
      setImagePreview={setImagePreview}
      openImagePreview={setImagePreview}
      openUrl={openUrl}
    />
  )
}

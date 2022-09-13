import React, { FC, useCallback, useEffect, useState } from 'react'
import { BackHandler, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { Chat } from '../../components/Chat/Chat.component'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { initActions } from '../../store/init/init.slice'
import { replaceScreen } from '../../utils/functions/replaceScreen/replaceScreen'

import { CancelDownload, FileMetadata, files, identity, messages, publicChannels } from '@quiet/state-manager'
import { Appbar } from '../../components/Appbar/Appbar.component'
import { ImagePreviewModal } from '../../components/ImagePreview/ImagePreview.component'

export const ChannelScreen: FC = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(initActions.setCurrentScreen(ScreenNames.ChannelScreen))
  })

  const handleBackButtonClick = () => {
    dispatch(publicChannels.actions.setCurrentChannel({ channelAddress: '' }))
    replaceScreen(ScreenNames.ChannelListScreen)
    return true
  }

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick)
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackButtonClick)
    }
  }, [])

  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const currentChannel = useSelector(publicChannels.selectors.currentChannel)

  const channelMessagesCount = useSelector(publicChannels.selectors.currentChannelMessagesCount)

  const channelMessages = useSelector(publicChannels.selectors.currentChannelMessagesMergedBySender)

  const downloadStatusesMapping = useSelector(files.selectors.downloadStatuses)

  const downloadFile = useCallback((media: FileMetadata) => {
    dispatch(files.actions.downloadFile(media))
  }, [dispatch])

  const cancelDownload = useCallback((cancelDownload: CancelDownload) => {
    dispatch(files.actions.cancelDownload(cancelDownload))
  }, [dispatch])

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

  return (
    <>
    <View style={{ flex: 1 }}>
      {currentChannel && (
        <>
          <Appbar title={`#${currentChannel.name}`} back={handleBackButtonClick} />
          <Chat
            sendMessageAction={sendMessageAction}
            loadMessagesAction={loadMessages}
            channel={currentChannel}
            user={currentIdentity.nickname}
            messages={{
              count: channelMessagesCount,
              groups: channelMessages
            }}
            downloadStatuses={downloadStatusesMapping}
            downloadFile={downloadFile}
            cancelDownload={cancelDownload}
            openImagePreview={setImagePreview}
          />
          <ImagePreviewModal
            imagePreviewData={imagePreview}
            currentChannelName={currentChannel.name}
            resetPreviewData={() => setImagePreview(null)}
          />
        </>
      )}
      
    </View>
    </>
  )
}

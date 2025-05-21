import React, { FC, useRef, useState, useEffect, useCallback } from 'react'
import {
  Keyboard,
  View,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  NativeSyntheticEvent,
  TextInputChangeEventData,
  TextInputEndEditingEventData,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Appbar } from '../../components/Appbar/Appbar.component'
import { Loading } from '../Loading/Loading.component'
import { ImageAttachmentPreviewModal } from '../../components/ImageAttachmentPreview/ImageAttachmentPreview.component'
import { Message } from '../Message/Message.component'
import { Input } from '../Input/Input.component'
import { MessageSendButton } from '../MessageSendButton/MessageSendButton.component'
import { ChannelMessagesComponentProps, ChatProps } from './Chat.types'
import { FileActionsProps } from '../FileAttachment/FileAttachment.types'
import { AttachmentButton } from '../AttachmentButton/AttachmentButton.component'
import DocumentPicker, { DocumentPickerResponse, types } from 'react-native-document-picker'
import UploadFilesPreviewsComponent from '../FileAttachmentPreview/FileAttachmentPreview.component'
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker'
import { defaultTheme } from '../../styles/themes/default.theme'
import { createLogger } from '../../utils/logger'

const logger = createLogger('chat:component')

export const Chat: FC<ChatProps & FileActionsProps> = ({
  contextMenu,
  sendMessageAction,
  loadMessagesAction,
  handleBackButton,
  channel,
  messages = {
    count: 0,
    groups: {},
  },
  pendingMessages = {},
  downloadStatuses = {},
  downloadFile,
  cancelDownload,
  imageAttachmentPreview,
  setImageAttachmentPreview,
  openImageAttachmentPreview,
  updateFileAttachments,
  updateUploadedImages,
  removeFilePreview,
  fileAttachments,
  openUrl,
  duplicatedUsernameHandleBack,
  unregisteredUsernameHandleBack,
  ready = true,
}) => {
  const [didKeyboardShow, setKeyboardShow] = useState(false)
  const [messageInput, setMessageInput] = useState<string>('')

  const messageInputRef = useRef<null | TextInput>(null)
  // keep latest input text (including any pending autocorrect) in a ref
  const messageInputValueRef = useRef<string>('')

  const insets = useSafeAreaInsets()

  const defaultPadding = 20

  const areFilesUploaded = useCallback(() => {
    if (!fileAttachments) return false
    if (Object.keys(fileAttachments).length <= 0) return false
    return true
  }, [fileAttachments])()

  const shouldDisableSubmit = useCallback(() => {
    if (!ready) return true

    const isInputEmpty = messageInput.length === 0
    if (isInputEmpty && !areFilesUploaded) return true

    return false
  }, [messageInput, areFilesUploaded, ready])()

  useEffect(() => {
    const onKeyboardDidShow = () => {
      setKeyboardShow(true)
    }

    const onKeyboardDidHide = () => {
      setKeyboardShow(false)
    }

    const showSubscription = Keyboard.addListener('keyboardDidShow', onKeyboardDidShow)
    const hideSubscription = Keyboard.addListener('keyboardDidHide', onKeyboardDidHide)

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [messageInput?.length, setKeyboardShow])

  const onInputTextChange = (value: string) => {
    // track current text on manual entry
    messageInputValueRef.current = value
    setMessageInput(value)
  }
  // capture native change events (e.g., autocorrect commit)
  const onInputChange = useCallback((e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const value = e.nativeEvent.text
    messageInputValueRef.current = value
    setMessageInput(value)
  }, [])
  // capture end of editing (e.g., on blur)
  const onInputEndEditing = useCallback((e: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
    const value = e.nativeEvent.text
    messageInputValueRef.current = value
    setMessageInput(value)
  }, [])

  const openAttachments = async () => {
    let response: DocumentPickerResponse[]
    try {
      response = await DocumentPicker.pick({
        presentationStyle: 'fullScreen',
        type: [types.allFiles],
        allowMultiSelection: true,
        copyTo: 'cachesDirectory',
      })
    } catch (e) {
      if (!DocumentPicker.isCancel(e)) {
        logger.error(`Could not attach files: ${e.message}`)
        // TODO: display error message to user
      }
      return
    }
    if (response) {
      updateFileAttachments(response)
    }
  }

  const openImages = async () => {
    launchImageLibrary(
      {
        presentationStyle: 'fullScreen',
        mediaType: 'mixed', // photos and videos
        selectionLimit: 5, // we don't want to overwhelm helia or libp2p
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel === true) {
          logger.debug(`User cancelled image library fetch`)
          return
        }

        if (response.errorCode != null || response.errorMessage != null) {
          logger.error(`Error while fetching image library`, response.errorCode, response.errorMessage)
          return
        }

        if (response.assets != null && response.assets.length > 0) {
          updateUploadedImages(response.assets)
        }
      }
    )
  }

  const onPress = () => {
    // only send if there's text or uploaded files
    if (messageInputValueRef.current.length > 0 || areFilesUploaded) {
      if (messageInputValueRef.current.length > 0) {
        // append space to force iOS to commit any pending autocorrect
        const original = messageInputValueRef.current
        const commitText = original + ' '
        // update native text to trigger autocorrect commit
        messageInputRef.current?.setNativeProps({ text: commitText })
        messageInputValueRef.current = commitText
        // after commit, send trimmed text and clear input
        setTimeout(() => {
          const textToSend = messageInputValueRef.current.trim()
          sendMessageAction(textToSend)
          // clear native input and reset state
          messageInputRef.current?.clear()
          messageInputValueRef.current = ''
          setMessageInput('')
        }, 50)
      } else {
        // no text but files attached
        sendMessageAction('')
      }
    }
  }

  const renderItem = ({ item }: { item: string }) => (
    <ChannelMessagesComponent
      messages={messages.groups[item]}
      pendingMessages={pendingMessages}
      day={item}
      downloadStatuses={downloadStatuses}
      downloadFile={downloadFile}
      cancelDownload={cancelDownload}
      openImageAttachmentPreview={openImageAttachmentPreview}
      openUrl={openUrl}
      duplicatedUsernameHandleBack={duplicatedUsernameHandleBack}
      unregisteredUsernameHandleBack={unregisteredUsernameHandleBack}
    />
  )

  return (
    <View style={{ flex: 1 }} testID={`chat_${channel?.name}`}>
      <Appbar title={`#${channel?.name}`} back={handleBackButton} contextMenu={contextMenu} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: insets.bottom, android: 0 })}
        enabled={Platform.select({ ios: true, android: false })}
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'flex-end',
          backgroundColor: defaultTheme.palette.background.white,
          paddingBottom: defaultPadding,
        }}
      >
        {messages.count === 0 ? (
          <Loading title={'Loading messages'} caption={'Chat will become available shortly'} />
        ) : (
          <>
            <FlatList
              // There's a performance issue with inverted prop on FlatList, so we're double rotating the elements as a workaround
              // https://github.com/facebook/react-native/issues/30034
              style={{
                transform: [{ rotate: '180deg' }],
                paddingLeft: defaultPadding,
                paddingRight: defaultPadding,
              }}
              data={Object.keys(messages.groups).reverse()}
              keyExtractor={item => item}
              renderItem={item => {
                return <View style={{ transform: [{ rotate: '180deg' }] }}>{renderItem(item)}</View>
              }}
              onEndReached={() => {
                loadMessagesAction(true)
              }}
              onEndReachedThreshold={0.7}
              showsVerticalScrollIndicator={false}
            />
            <View
              style={{
                flexDirection: 'row',
                paddingBottom: Platform.select({ ios: 20, android: 0 }),
              }}
            >
              <View
                style={{
                  width: '100%',
                  paddingLeft: defaultPadding,
                  paddingRight: !didKeyboardShow && !areFilesUploaded ? defaultPadding : 0,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ justifyContent: 'center' }}>
                      <Input
                        ref={messageInputRef}
                        // uncontrolled: do not pass value to allow native setNativeProps to work
                        onChangeText={onInputTextChange}
                        onChange={onInputChange}
                        onEndEditing={onInputEndEditing}
                        placeholder={`Message #${channel?.name}`}
                        multiline={true}
                        style={{ paddingRight: 50 }}
                        round
                      />
                    </View>
                    <View
                      style={{
                        position: 'absolute',
                        height: '100%',
                        right: 10,
                        justifyContent: 'center',
                      }}
                    >
                      <AttachmentButton onPress={openImages} />
                    </View>
                  </View>
                  {(didKeyboardShow || areFilesUploaded) && (
                    <MessageSendButton onPress={onPress} disabled={shouldDisableSubmit} />
                  )}
                </View>
                {fileAttachments && (
                  <UploadFilesPreviewsComponent filesData={fileAttachments} removeFile={removeFilePreview} />
                )}
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
      {imageAttachmentPreview && setImageAttachmentPreview && (
        <ImageAttachmentPreviewModal
          imageAttachmentPreviewData={imageAttachmentPreview}
          currentChannelName={channel?.name}
          resetPreviewData={() => setImageAttachmentPreview(null)}
        />
      )}
    </View>
  )
}

export const ChannelMessagesComponent: React.FC<ChannelMessagesComponentProps & FileActionsProps> = ({
  messages,
  day,
  pendingMessages,
  downloadStatuses,
  downloadFile,
  cancelDownload,
  openImageAttachmentPreview,
  openUrl,
  duplicatedUsernameHandleBack,
  unregisteredUsernameHandleBack,
}) => {
  return (
    <View key={day}>
      {/* <MessagesDivider title={day} /> */}
      {messages.map(data => {
        // Messages merged by sender (DisplayableMessage[])
        const messageId = data[0].id
        return (
          <Message
            key={messageId}
            data={data}
            downloadStatus={downloadStatuses?.[messageId]}
            downloadFile={downloadFile}
            cancelDownload={cancelDownload}
            openImageAttachmentPreview={openImageAttachmentPreview}
            openUrl={openUrl}
            pendingMessages={pendingMessages}
            duplicatedUsernameHandleBack={duplicatedUsernameHandleBack}
            unregisteredUsernameHandleBack={unregisteredUsernameHandleBack}
          />
        )
      })}
    </View>
  )
}

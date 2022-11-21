import React, { FC, useState, useEffect, useRef } from 'react'
import { Keyboard, View, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { Appbar } from '../../components/Appbar/Appbar.component'
import { ImagePreviewModal } from '../../components/ImagePreview/ImagePreview.component'
import { Spinner } from '../Spinner/Spinner.component'
import { Message } from '../Message/Message.component'
import { Input } from '../Input/Input.component'
import { MessageSendButton } from '../MessageSendButton/MessageSendButton.component'
import { ChannelMessagesComponentProps, ChatProps } from './Chat.types'
import { FileActionsProps } from '../UploadedFile/UploadedFile.types'

export const Chat: FC<ChatProps & FileActionsProps> = ({
  sendMessageAction,
  loadMessagesAction,
  handleBackButton,
  channel,
  user,
  messages = {
    count: 0,
    groups: {}
  },
  pendingMessages = {},
  downloadStatuses = {},
  downloadFile,
  cancelDownload,
  imagePreview,
  setImagePreview,
  openImagePreview,
  openUrl
}) => {
  const [didKeyboardShow, setKeyboardShow] = useState(false)
  const [messageInput, setMessageInput] = useState<string | undefined>()

  const messageInputRef = useRef<null | TextInput>(null)

  const defaultPadding = 20

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

  const [isInputEmpty, setInputEmpty] = useState(true)

  const onInputTextChange = (value: string) => {
    if (value.length === 0) {
      setInputEmpty(true)
    } else {
      setInputEmpty(false)
    }
    setMessageInput(value)
  }

  const onPress = () => {
    if (!messageInputRef.current || messageInput === undefined || messageInput?.length === 0) {
      return
    }
    messageInputRef.current.clear()
    sendMessageAction(messageInput)
    setMessageInput('')
    setInputEmpty(true)
  }

  const renderItem = ({ item }) => (
    <ChannelMessagesComponent
      messages={messages.groups[item]}
      pendingMessages={pendingMessages}
      day={item}
      downloadStatuses={downloadStatuses}
      downloadFile={downloadFile}
      cancelDownload={cancelDownload}
      openImagePreview={openImagePreview}
      openUrl={openUrl}
    />
  )

  return (
    <View style={{ flex: 1 }}>
      <Appbar title={`#${channel.name}`} back={handleBackButton} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: null })}
        keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })}
        enabled={Platform.select({ ios: true, android: false })}
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'flex-end',
          backgroundColor: 'white',
          paddingBottom: defaultPadding
        }}>
        {messages.count === 0 ? (
          <Spinner description='Replicating messages' />
        ) : (
          <FlatList
            // There's a performance issue with inverted prop on FlatList, so we're double rotating the elements as a workaround
            // https://github.com/facebook/react-native/issues/30034
            style={{
              transform: [{ rotate: '180deg' }],
              paddingLeft: defaultPadding,
              paddingRight: defaultPadding
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
        )}
        <View style={{ flexDirection: 'row' }}>
        <View
          style={{
            flex: 9,
            paddingLeft: defaultPadding,
            paddingRight: !didKeyboardShow ? defaultPadding : 0
          }}>
            <Input
              ref={messageInputRef}
              onChangeText={onInputTextChange}
              placeholder={`Message #${channel.name}`}
              multiline={true}
            />
          </View>
          {didKeyboardShow && <MessageSendButton onPress={onPress} disabled={isInputEmpty} />}
        </View>
      </KeyboardAvoidingView>
      <ImagePreviewModal
        imagePreviewData={imagePreview}
        currentChannelName={channel.name}
        resetPreviewData={() => setImagePreview(null)}
      />
    </View>
  )
}

export const ChannelMessagesComponent: React.FC<
  ChannelMessagesComponentProps & FileActionsProps
> = ({
  messages,
  day,
  pendingMessages,
  downloadStatuses,
  downloadFile,
  cancelDownload,
  openImagePreview,
  openUrl
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
            downloadStatus={downloadStatuses[messageId]}
            downloadFile={downloadFile}
            cancelDownload={cancelDownload}
            openImagePreview={openImagePreview}
            openUrl={openUrl}
            pendingMessages={pendingMessages}
          />
        )
      })}
    </View>
  )
}

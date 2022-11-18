import React, { FC, useState, useEffect, useRef } from 'react'
import { Keyboard, View, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { Message } from '../Message/Message.component'
import { Input } from '../Input/Input.component'
import { MessageSendButton } from '../MessageSendButton/MessageSendButton.component'

import { ChannelMessagesComponentProps, ChatProps } from './Chat.types'
import { FileActionsProps } from '../UploadedFile/UploadedFile.types'

export const Chat: FC<ChatProps & FileActionsProps> = ({
  sendMessageAction,
  loadMessagesAction,
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
  openImagePreview
}) => {
  const [didKeyboardShow, setKeyboardShow] = useState(false)
  const [messageInput, setMessageInput] = useState<string | undefined>()

  const messageInputRef = useRef<null | TextInput>(null)

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
    />
  )

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: null })}
      keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })}
      enabled={Platform.select({ ios: true, android: false })}
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        backgroundColor: 'white',
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 20
      }}>
      <FlatList
        // There's a performance issue with inverted prop on FlatList, so we're double rotating the elements as a workaround
        // https://github.com/facebook/react-native/issues/30034
        style={{ transform: [{ rotate: '180deg' }] }}
        data={Object.keys(messages.groups).reverse()}
        keyExtractor={item => item}
        renderItem={(item) => {
          return (
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              {renderItem(item)}
            </View>
          )
        }}
        onEndReached={() => {
          loadMessagesAction(true)
        }}
        onEndReachedThreshold={0.7}
        showsVerticalScrollIndicator={false}
      />
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 9 }}>
          <Input
            ref={messageInputRef}
            onChangeText={onInputTextChange}
            placeholder={`Message #${channel.name}`}
            multiline={true}
          />
        </View>
        {didKeyboardShow && (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <MessageSendButton onPress={onPress} disabled={isInputEmpty} />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

export const ChannelMessagesComponent: React.FC<ChannelMessagesComponentProps & FileActionsProps> = ({
  messages,
  day,
  pendingMessages,
  downloadStatuses,
  downloadFile,
  cancelDownload,
  openImagePreview
}) => {
  return (
    <View key={day}>
      {/* <MessagesDivider title={day} /> */}
      {messages.map(data => {
        // Messages merged by sender (DisplayableMessage[])
        const messageId = data[0].id
        return <Message
          key={messageId}
          data={data}
          downloadStatus={downloadStatuses[messageId]}
          downloadFile={downloadFile}
          cancelDownload={cancelDownload}
          openImagePreview={openImagePreview}
          pendingMessages={pendingMessages}
        />
      })}
    </View>
  )
}

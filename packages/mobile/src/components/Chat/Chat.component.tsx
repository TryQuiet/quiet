import React, { FC, useState, useEffect, useRef } from 'react'
import {
  Keyboard,
  View,
  FlatList,
  TextInput
} from 'react-native'
import { Message } from '../Message/Message.component'
import { Input } from '../Input/Input.component'
import { MessageSendButton } from '../MessageSendButton/MessageSendButton.component'

import { ChannelMessagesComponentProps, ChatProps } from './Chat.types'
import { useCallback } from 'react'

export const Chat: FC<ChatProps> = ({
  sendMessageAction,
  loadMessagesAction,
  channel,
  user,
  messages = {
    count: 0,
    groups: {}
  }
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

    Keyboard.addListener('keyboardDidShow', onKeyboardDidShow)
    Keyboard.addListener('keyboardDidHide', onKeyboardDidHide)

    return () => {
      Keyboard.removeListener('keyboardDidShow', onKeyboardDidShow)
      Keyboard.removeListener('keyboardDidHide', onKeyboardDidHide)
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

  const renderItem = useCallback(({ item }) => (
    <ChannelMessagesComponent messages={messages.groups[item]} day={item} />
  ), [])

  return (
    <View
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
        inverted
        showsVerticalScrollIndicator={false}
        data={Object.keys(messages.groups).reverse()}
        keyExtractor={item => item}
        renderItem={renderItem}
        onEndReached={() => {
          loadMessagesAction(true)
        }}
        onEndReachedThreshold={0.7}
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
    </View>
  )
}

export const ChannelMessagesComponent: React.FC<ChannelMessagesComponentProps> = ({
  messages,
  day
}) => {
  return (
    <View key={day}>
      {/* <MessagesDivider title={day} /> */}
      {messages.map(data => {
        // Messages merged by sender (DisplayableMessage[])
        return <Message key={data[0].id} data={data} />
      })}
    </View>
  )
}

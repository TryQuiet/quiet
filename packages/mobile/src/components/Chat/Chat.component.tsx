import React, { FC, useState, useEffect, useRef } from 'react'
import {
  Keyboard,
  Platform,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  FlatList,
  TextInput
} from 'react-native'
import { Message } from '../Message/Message.component'
import { Input } from '../Input/Input.component'
import { MessageSendButton } from '../MessageSendButton/MessageSendButton.component'

import { ChannelMessagesComponentProps, ChatProps } from './Chat.types'

export const Chat: FC<ChatProps> = ({
  sendMessageAction,
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
  }

  const inputStyle = didKeyboardShow ? customInputStyle.expanded : {}
  const inputWrapperStyle = didKeyboardShow
    ? customInputWrapperStyle.expanded
    : customInputWrapperStyle.default

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={25}
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        backgroundColor: 'white'
      }}>
      <FlatList
        inverted
        data={Object.keys(messages.groups)}
        renderItem={() => <ChannelMessagesComponent messages={messages.groups} />}
        style={{ paddingLeft: 20, paddingRight: 20 }}
      />
      <View style={inputWrapperStyle}>
        <Input
          ref={messageInputRef}
          onChangeText={onInputTextChange}
          placeholder={'Message #' + channel.name + ' as @' + user}
          multiline={true}
          style={inputStyle}
        />
      </View>
      {didKeyboardShow && (
        <View
          style={{
            alignContent: 'center',
            height: 56,
            paddingLeft: 20,
            paddingRight: 20,
            backgroundColor: '#fbfbfb'
          }}>
          <View style={{ alignSelf: 'flex-end' }}>
            <MessageSendButton onPress={onPress} disabled={isInputEmpty} />
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const customInputWrapperStyle = StyleSheet.create({
  default: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20
  },
  expanded: {
    padding: 0
  }
})

const customInputStyle = StyleSheet.create({
  expanded: {
    borderTopWidth: 1,
    borderWidth: 0
  }
})

export const ChannelMessagesComponent: React.FC<ChannelMessagesComponentProps> = ({ messages }) => {
  return (
    <>
      {Object.keys(messages).map(day => {
        return (
          <div key={day}>
            {/* <MessagesDivider title={day} /> */}
            {messages[day].map(data => {
            // Messages merged by sender (DisplayableMessage[])
              return <Message key={data[0].id} data={data} />
            })}
          </div>
        )
      })}
    </>
  )
}

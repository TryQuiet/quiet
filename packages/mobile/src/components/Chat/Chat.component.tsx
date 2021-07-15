import React, { FC, useState, useEffect, useRef } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView, FlatList } from 'react-native';
import { Message } from '../Message/Message.component';
import { Input } from '../Input/Input.component';
import { MessageSendButton } from '../MessageSendButton/MessageSendButton.component';

import { ChatProps } from './Chat.types';
import { TextInput } from 'react-native';

export const Chat: FC<ChatProps> = ({
  sendMessageAction,
  channel,
  messages,
  user,
}) => {
  const [didKeyboardShow, setKeyboardShow] = useState(false);
  const [messageInput, setMessageInput] = useState<string | undefined>();

  const messageInputRef = useRef<null | TextInput>(null);

  useEffect(() => {
    const onKeyboardDidShow = () => {
      setKeyboardShow(true);
    };

    const onKeyboardDidHide = () => {
      setKeyboardShow(false);
    };

    Keyboard.addListener('keyboardDidShow', onKeyboardDidShow);
    Keyboard.addListener('keyboardDidHide', onKeyboardDidHide);

    return () => {
      Keyboard.removeListener('keyboardDidShow', onKeyboardDidShow);
      Keyboard.removeListener('keyboardDidHide', onKeyboardDidHide);
    };
  }, [messageInput?.length, setKeyboardShow]);

  const [isInputEmpty, setInputEmpty] = useState(true);

  const onInputTextChange = (value: string) => {
    if (value.length === 0) {
      setInputEmpty(true);
    } else {
      setInputEmpty(false);
    }
    setMessageInput(value);
  };

  const onPress = () => {
    if (
      !messageInputRef.current ||
      messageInput === undefined ||
      messageInput?.length === 0
    ) {
      return;
    }
    messageInputRef.current.clear();
    sendMessageAction(messageInput);
    setMessageInput('');
  };

  const inputStyle = didKeyboardShow ? customInputStyle.expanded : {};
  const inputWrapperStyle = didKeyboardShow
    ? customInputWrapperStyle.expanded
    : customInputWrapperStyle.default;

  return (
    <KeyboardAvoidingView
      behavior="height"
      keyboardVerticalOffset={25}
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        backgroundColor: 'white',
      }}>
      <FlatList
        inverted
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <Message message={item} />}
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
        <View style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 15 }}>
          <View style={{ alignSelf: 'flex-end' }}>
            <MessageSendButton onPress={onPress} disabled={isInputEmpty} />
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const customInputWrapperStyle = StyleSheet.create({
  default: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
  },
  expanded: {
    padding: 0,
  },
});

const customInputStyle = StyleSheet.create({
  expanded: {
    borderTopWidth: 1,
    borderWidth: 0,
  },
});

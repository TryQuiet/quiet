import React, { FC, useEffect, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { Message } from '../Message/Message.component';
import { MessageInput } from '../MessageInput/MessageInput.component';
import { MessageSendButton } from '../MessageSendButton/MessageSendButton.component';

import { ChatProps } from './Chat.types';

export const Chat: FC<ChatProps> = ({
  sendMessageAction,
  channel,
  messages,
  user,
}) => {
  const [didKeyboardShow, setKeyboardShow] = useState(false);

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
  }, [setKeyboardShow]);

  const [isInputEmpty, setInputEmpty] = useState(true);

  const onInputTextChange = (value: string) => {
    if (value.length === 0) {
      setInputEmpty(true);
    } else {
      setInputEmpty(false);
    }
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
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <Message message={item} />}
        style={{ paddingLeft: 20, paddingRight: 20 }}
      />
      <View style={inputWrapperStyle}>
        <MessageInput
          onChangeText={onInputTextChange}
          placeholder={'Message #' + channel.name + ' as @' + user}
          style={inputStyle}
        />
      </View>

      {didKeyboardShow && (
        <View style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 10 }}>
          <View style={{ alignSelf: 'flex-end' }}>
            <MessageSendButton
              onPress={sendMessageAction}
              disabled={isInputEmpty}
            />
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

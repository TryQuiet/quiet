import React, { FC } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { View } from 'react-native';
import { Typography } from '../Typography/Typography.component';
import { MessageProps } from './Message.types';
import Jdenticon from 'react-native-jdenticon';

export const Message: FC<MessageProps> = ({ message }) => {
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          paddingBottom: 20,
        }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            paddingRight: 12,
          }}>
          <Jdenticon
            value={message.nickname}
            size={38}
            style={{ padding: 0 }}
          />
        </View>
        <View style={{ flex: 10 }}>
          <View style={{ flexDirection: 'row', paddingBottom: 3 }}>
            <View style={{ alignSelf: 'flex-start' }}>
              <Typography fontSize={16} fontWeight={'medium'}>
                {message.nickname}
              </Typography>
            </View>
            <View
              style={{
                alignSelf: 'flex-start',
                paddingTop: 2,
                paddingLeft: 8,
              }}>
              <Typography fontSize={14} color={'subtitle'}>
                {message.createdAt}
              </Typography>
            </View>
          </View>
          <View style={{ flexShrink: 1 }}>
            <Typography fontSize={14}>{message.message}</Typography>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

import React, { FC, useCallback } from 'react';
import { Image } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { appImages } from '../../../assets';

import { MessageSendButtonProps } from './MessageSendButton.types';

export const MessageSendButton: FC<MessageSendButtonProps> = ({
  onPress,
  disabled,
}) => {
  const handlePress = useCallback(() => {
    if (!disabled) {
      onPress();
    }
  }, [disabled, onPress]);

  const icon = disabled ? appImages.icon_send_disabled : appImages.icon_send;

  return (
    <TouchableWithoutFeedback
      onPress={handlePress}
      style={{
        height: 56,
        width: 56,
        justifyContent: 'center',
      }}>
      <Image
        source={icon}
        resizeMode="cover"
        resizeMethod="resize"
        style={{
          alignSelf: 'center',
          marginBottom: 5,
          width: 30,
          height: 30,
        }}
      />
    </TouchableWithoutFeedback>
  );
};

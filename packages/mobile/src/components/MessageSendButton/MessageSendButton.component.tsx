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
    <TouchableWithoutFeedback onPress={handlePress}>
      <Image
        source={icon}
        style={{
          resizeMode: 'cover',
          width: 24,
          height: 24,
        }}
      />
    </TouchableWithoutFeedback>
  );
};

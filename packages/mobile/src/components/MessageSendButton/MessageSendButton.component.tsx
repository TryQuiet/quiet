import React, { FC, useCallback } from 'react'
import { TouchableWithoutFeedback, View, Image } from 'react-native'
import { appImages } from '../../../assets'

import { MessageSendButtonProps } from './MessageSendButton.types'

export const MessageSendButton: FC<MessageSendButtonProps> = ({ onPress, disabled }) => {
  const handlePress = useCallback(() => {
    if (!disabled) {
      onPress()
    }
  }, [disabled, onPress])

  const icon = disabled ? appImages.icon_send_disabled : appImages.icon_send

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View
        style={{
          flex: 1.5,
          justifyContent: 'center'
        }}>
        <Image
          source={icon}
          resizeMode='cover'
          resizeMethod='resize'
          style={{
            alignSelf: 'center',
            width: 20,
            height: 20
          }}
        />
      </View>
    </TouchableWithoutFeedback>
  )
}

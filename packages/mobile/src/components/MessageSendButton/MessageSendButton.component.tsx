import React, { FC, useCallback } from 'react'
import { TouchableWithoutFeedback, View, Image } from 'react-native'
import { icons } from '../../assets'

import { MessageSendButtonProps } from './MessageSendButton.types'

/** The smallest comfortable finger target; every guideline puts it at 44. */
const TOUCH_TARGET = 44
const TOUCH_SLOP = { top: 8, bottom: 8, left: 8, right: 8 }

export const MessageSendButton: FC<MessageSendButtonProps> = ({ onPress, disabled }) => {
  const handlePress = useCallback(() => {
    if (!disabled) {
      onPress()
    }
  }, [disabled, onPress])

  const icon = disabled ? icons.icon_send_disabled : icons.icon_send

  return (
    <TouchableWithoutFeedback onPress={handlePress} hitSlop={TOUCH_SLOP} testID={'send_message_button'}>
      <View
        style={{
          paddingLeft: 20,
          paddingRight: 20,
          justifyContent: 'center',
          alignItems: 'center',
          // A 20pt glyph padded only on its sides gave a target 60 wide and 20 tall. Every
          // guideline puts the smallest comfortable finger target at 44, and the height is the
          // dimension that was missing.
          minHeight: TOUCH_TARGET,
        }}
      >
        <Image
          source={icon}
          resizeMode='cover'
          resizeMethod='resize'
          style={{
            alignSelf: 'center',
            width: 20,
            height: 20,
          }}
        />
      </View>
    </TouchableWithoutFeedback>
  )
}

import React, { FC, useCallback } from 'react'
import { TouchableWithoutFeedback, View, Image } from 'react-native'
import { appImages } from '../../assets'

import { AttachmentButtonProps } from './AttachmentButton.types'

export const AttachmentButton: FC<AttachmentButtonProps> = ({ onPress, disabled }) => {
  const handlePress = useCallback(() => {
    if (!disabled) {
      onPress()
    }
  }, [disabled, onPress])

  const icon = appImages.paperclip_active

  console.log('Hello')

  return (
    <TouchableWithoutFeedback onPress={handlePress} testID={'send_message_button'}>
      <View
        style={{
          flex: 1.5,
          justifyContent: 'center',
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

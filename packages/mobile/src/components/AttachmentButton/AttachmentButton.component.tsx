import React, { FC, useCallback } from 'react'
import { TouchableWithoutFeedback, View, Image } from 'react-native'
import { icons } from '../../assets'
import { AttachmentButtonProps } from './AttachmentButton.types'

/** The smallest comfortable finger target; every guideline puts it at 44. */
const TOUCH_TARGET = 44
const TOUCH_SLOP = { top: 8, bottom: 8, left: 8, right: 8 }

export const AttachmentButton: FC<AttachmentButtonProps> = ({ onPress }) => {
  const icon = icons.paperclip_gray

  return (
    <TouchableWithoutFeedback onPress={onPress} hitSlop={TOUCH_SLOP} testID={'attach_file_button'}>
      <View
        style={{
          paddingLeft: 5,
          paddingRight: 5,
          // Same as the send button beside it: a 24pt glyph with 5 of side padding is a 34x24
          // target. 44 is the floor, and hitSlop covers what the box still misses.
          minWidth: TOUCH_TARGET,
          minHeight: TOUCH_TARGET,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={icon}
          style={{
            alignSelf: 'center',
            width: 24,
            height: 24,
          }}
        />
      </View>
    </TouchableWithoutFeedback>
  )
}

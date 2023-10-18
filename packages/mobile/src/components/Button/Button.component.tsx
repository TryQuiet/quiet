import React, { FC } from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import { ButtonProps } from './Button.types'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'

export const Button: FC<ButtonProps> = ({ onPress, title, width, loading, negative, disabled }) => {
  return (
    <TouchableWithoutFeedback
      onPress={event => {
        // event.persist()
        if (!disabled) onPress()
      }}
      testID={'button'}
    >
      <View
        style={{
          paddingVertical: 12,
          marginVertical: !negative ? 12 : 0,
          backgroundColor: disabled ? 'grey' : !negative ? defaultTheme.palette.main.brand : 'transparent',
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 45,
          width,
        }}
      >
        <Typography fontSize={14} color={!negative ? 'white' : 'gray50'}>
          {title}
        </Typography>
      </View>
    </TouchableWithoutFeedback>
  )
}

import React, { FC } from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import { ButtonProps } from './Button.types'
import * as Progress from 'react-native-progress'
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
          backgroundColor: !negative ? defaultTheme.palette.main.brand : 'transparent',
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 45,
          width,
        }}
      >
        {!loading ? (
          <Typography fontSize={14} color={!negative ? 'white' : 'gray50'}>
            {title}
          </Typography>
        ) : (
          <Progress.CircleSnail color={['white']} size={20} thickness={1.5} />
        )}
      </View>
    </TouchableWithoutFeedback>
  )
}

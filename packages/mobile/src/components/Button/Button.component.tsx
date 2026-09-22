import React, { FC } from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import { ButtonProps } from './Button.types'
import * as Progress from 'react-native-progress'

import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'

const BUTTON_RADIUS = 16
const BUTTON_HEIGHT = 50

export const Button: FC<ButtonProps> = ({ onPress, title, width, loading, negative, disabled, newDesign, testID }) => {
  return (
    <TouchableWithoutFeedback
      onPress={event => {
        // event.persist()
        if (!disabled) onPress()
      }}
      testID={testID ?? 'button'}
    >
      <View
        style={{
          paddingVertical: 12,
          paddingHorizontal: 20,
          backgroundColor: disabled ? 'grey' : !negative ? defaultTheme.palette.main.brand : 'transparent',
          // The design library draws every Button at radius 16 and 50 tall (e.g. "Create channel /
          // Version=3" 5055:16131); the component was drawing an 8-radius, 45-tall box by default.
          borderRadius: BUTTON_RADIUS,
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: BUTTON_HEIGHT,
          width,
        }}
      >
        {!loading ? (
          <Typography fontSize={newDesign ? 16 : 14} color={!negative ? 'white' : 'gray50'}>
            {title}
          </Typography>
        ) : (
          <Progress.CircleSnail color={['white']} size={20} thickness={1.5} />
        )}
      </View>
    </TouchableWithoutFeedback>
  )
}

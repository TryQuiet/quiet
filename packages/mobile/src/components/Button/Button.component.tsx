import React, { FC } from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import { ButtonProps } from './Button.types'

import * as Progress from 'react-native-progress'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'

export const Button: FC<ButtonProps> = ({ onPress, title, loading }) => {
  return (
    <TouchableWithoutFeedback
      onPress={onPress}>
      <View
        style={{
          marginVertical: 12,
          paddingVertical: 12,
          backgroundColor: defaultTheme.palette.main.brand,
          borderRadius: 5,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {!loading ? (
        <Typography fontSize={14} color={'white'}>
          {title}
        </Typography>
      ) : (
        <Progress.CircleSnail color={['white']} size={20} thickness={1.5} />
      )}
      </View>
    </TouchableWithoutFeedback>
  )
}

import React, { FC } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Typography } from '../Typography/Typography.component'
import { SpinnerProps } from './Spinner.types'

export const Spinner: FC<SpinnerProps> = ({ description }) => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: defaultTheme.palette.background.white
      }}>
      <ActivityIndicator
        size='large'
        color={defaultTheme.palette.background.lushSky}
      />
      <Typography
        fontSize={14}
        horizontalTextAlign={'center'}
        style={{ margin: 10, maxWidth: 200 }}>
        {description}
      </Typography>
    </View>
  )
}

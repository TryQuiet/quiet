import React, { FC } from 'react'
import { View, Image } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Button } from '../Button/Button.component'
import { Typography } from '../Typography/Typography.component'

import { SuccessProps } from './Success.types'

export const Success: FC<SuccessProps> = ({
  onPress,
  icon,
  title,
  message
}) => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: defaultTheme.palette.background.white }}>
      <Image
        source={icon}
        style={{
          margin: 20,
          resizeMode: 'cover',
          width: 84,
          height: 84
        }}
      />
      <Typography fontSize={16} fontWeight={'medium'}>
        {title}
      </Typography>
      <Typography
        fontSize={14}
        horizontalTextAlign={'center'}
        style={{ margin: 10, maxWidth: 300 }}>
        {message}
      </Typography>
      <View style={{ width: 100 }}>
        <Button
          title={'Done'}
          onPress={onPress}
        />
      </View>
    </View>
  )
}

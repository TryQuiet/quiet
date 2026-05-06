import React, { FC } from 'react'
import { Image, View } from 'react-native'
import { icons } from '../../assets'
import { Typography } from '../Typography/Typography.component'

import { InitCheckProps } from './InitCheck.types'

export const InitCheck: FC<InitCheckProps> = ({ event, passed }) => {
  const color = passed ? 'grayDark' : 'grayLight'
  const icon = passed ? icons.check_circle_green : icons.check_circle_blank
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={icon}
        style={{
          margin: 5,
          resizeMode: 'cover',
          width: 14,
          height: 14,
        }}
      />
      <Typography fontSize={12} color={color}>
        {event}
      </Typography>
    </View>
  )
}

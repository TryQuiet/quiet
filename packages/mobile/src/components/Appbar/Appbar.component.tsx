import React, { FC } from 'react'
import { View, Image, TouchableWithoutFeedback } from 'react-native'
import { Typography } from '../Typography/Typography.component'

import { StyledAppbar } from './Appbar.styles'
import { AppbarProps } from './Appbar.types'

import { appImages } from '../../../assets'

export const Appbar: FC<AppbarProps> = ({ title, style, back = () => {} }) => {
  const icon = appImages.arrow_left
  return (
    <StyledAppbar style={style}>
      <TouchableWithoutFeedback
        onPress={() => {
          back()
        }}>
        <View style={{ flex: 2, justifyContent: 'center', alignItems: 'center' }}>
          <Image
            source={icon}
            resizeMode='cover'
            resizeMethod='resize'
            style={{
              width: 16,
              height: 16
            }}
          />
        </View>
      </TouchableWithoutFeedback>
      <View style={{ flex: 8, justifyContent: 'center', alignItems: 'center' }}>
        <Typography fontSize={16} fontWeight={'medium'}>
          {title}
        </Typography>
      </View>
      <View style={{ flex: 2 }} />
    </StyledAppbar>
  )
}

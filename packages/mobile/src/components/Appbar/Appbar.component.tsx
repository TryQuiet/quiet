import React, { FC } from 'react'
import { View, Image, TouchableWithoutFeedback } from 'react-native'
import { Typography } from '../Typography/Typography.component'

import { StyledAppbar } from './Appbar.styles'
import { AppbarProps } from './Appbar.types'

import { appImages } from '../../../assets'
import { defaultTheme } from '../../styles/themes/default.theme'

export const Appbar: FC<AppbarProps> = ({ title, prefix, position, style, back }) => {
  const icon = appImages.arrow_left
  return (
    <StyledAppbar style={style}>
      <TouchableWithoutFeedback
        onPress={() => {
          if (back) back()
        }}>
        <View style={{ justifyContent: 'center', alignItems: 'center', width: 64 }}>
          {back ? (
            <Image
              source={icon}
              resizeMode='cover'
              resizeMethod='resize'
              style={{
                width: 16,
                height: 16
              }}
            />
          ) : (
            <View
              style={{
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                backgroundColor: defaultTheme.palette.background.lushSky
              }}>
              <Typography fontSize={14} color={'white'}>
                {prefix}
                {title?.slice(0, 2).toLowerCase()}
              </Typography>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
      <View
        style={{ flexGrow: 1, justifyContent: 'center', alignItems: `${position || 'center'}` }}>
        <Typography fontSize={16} fontWeight={'medium'}>
          {title}
        </Typography>
      </View>
      <View style={{ width: 64 }} />
    </StyledAppbar>
  )
}

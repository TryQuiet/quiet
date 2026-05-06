import React, { FC } from 'react'
import { View, Text, Image } from 'react-native'

import { Typography } from '../Typography/Typography.component'
import { Button } from '../Button/Button.component'

import { NotifierProps } from './Notifier.types'

import { defaultTheme } from '../../styles/themes/default.theme'

export const Notifier: FC<NotifierProps> = ({ onButtonPress, onEmailPress, icon, title, message, style }) => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: defaultTheme.palette.background.white,
      }}
    >
      <Image
        source={icon}
        style={{
          margin: 20,
          resizeMode: 'cover',
          width: 375,
          height: 135,
        }}
      />
      <View style={{ flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 330 }}>
        <Typography fontSize={28} fontWeight={'medium'} horizontalTextAlign={'center'}>
          {title}
        </Typography>
        <Typography fontSize={14} fontWeight={'normal'} horizontalTextAlign={'center'}>
          {message}
        </Typography>
        <Button onPress={onButtonPress} title={'I understand'} width={135} newDesign />
        <Typography onPress={onEmailPress} fontSize={16} color={'gray50'}>
          Need help? <Text style={{ textDecorationLine: 'underline' }}>help@quiet.chat</Text>
        </Typography>
      </View>
    </View>
  )
}

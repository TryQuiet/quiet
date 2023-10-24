import React, { CSSProperties, FC, useEffect, useRef, useState } from 'react'
import { Animated, View, Image, Platform, StyleProp, ViewStyle } from 'react-native'
import { ConfirmationBoxProps } from './ConfirmationBox.types'
import { Typography } from '../Typography/Typography.component'

import { defaultPalette } from '../../styles/palettes/default.palette'
import { appImages } from '../../assets'

export const ConfirmationBox: FC<ConfirmationBoxProps> = ({ toggle, title }) => {
  const [visible, setVisible] = useState<boolean>(false)

  const animation = useRef(new Animated.Value(0)).current

  const fadeIn = () => {
    setVisible(true)
    Animated.timing(animation, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }

  const fadeOut = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false)
    })
  }

  useEffect(() => {
    toggle ? fadeIn() : fadeOut()
  }, [toggle])

  const icon = appImages.icon_check_white

  let style: StyleProp<ViewStyle> = {
    bottom: 35,
  }

  if (Platform.OS === 'ios') {
    style = {
      justifyContent: 'center',
      height: '100%',
    }
  }

  return (
    <Animated.View
      style={{
        display: visible ? 'flex' : 'none',
        alignItems: 'center',
        width: '100%',
        position: 'absolute',
        padding: 40,
        opacity: animation,
        ...style,
      }}
    >
      <View
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 16,
          backgroundColor: defaultPalette.background.black,
          width: 180,
          height: 84,
          borderRadius: 16,
        }}
      >
        <View
          style={{
            flex: 1.5,
            justifyContent: 'center',
          }}
        >
          <Image
            source={icon}
            resizeMode='cover'
            resizeMethod='resize'
            style={{
              width: 13,
              height: 13,
            }}
          />
        </View>
        <View
          style={{
            flex: 1,
          }}
        >
          <Typography fontSize={14} fontWeight={'normal'} color={'white'} style={{ lineHeight: 20 }}>
            {title}
          </Typography>
        </View>
      </View>
    </Animated.View>
  )
}

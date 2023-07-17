import React, { FC, useRef, useEffect } from 'react'
import { View, TouchableWithoutFeedback, Animated, Easing } from 'react-native'
import { defaultPalette } from '../../styles/palettes/default.palette'
import { Typography } from '../Typography/Typography.component'
import { ConnectionProcessComponentProps } from './ConnectionProcess.types'
import JoinCommunityImg from '../../../assets/icons/join-community.png'
import { Site } from '@quiet/common'

const ConnectionProcessComponent: FC<ConnectionProcessComponentProps> = ({ connectionProcess, openUrl }) => {
  const animationValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()
  }, [])

  const transformValues = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <View style={{ flex: 1, backgroundColor: defaultPalette.background.white }} testID={'connection-process-component'}>
      <View
        style={{
          padding: '10%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        <Animated.Image
          style={{ transform: [{ rotate: transformValues }], width: 120, height: 120 }}
          source={JoinCommunityImg}
        />
        <Typography
          fontSize={18}
          fontWeight={'medium'}
          style={{ marginTop: 24, marginBottom: 16 }}
          testID={'connection-process-title'}
        >
          Joining now!
        </Typography>

        <View style={{ width: 300, height: 4, backgroundColor: '#F0F0F0', borderRadius: 4 }}>
          <View
            style={{ backgroundColor: '#67BFD3', height: 4, width: connectionProcess.number * 3, borderRadius: 4 }}
          ></View>
        </View>
        <Typography
          testID='connection-process-text'
          fontSize={14}
          style={{ lineHeight: 20, textAlign: 'center', marginTop: 8 }}
        >
          {connectionProcess.text}
        </Typography>

        <Typography fontSize={14} style={{ lineHeight: 20, textAlign: 'center', marginTop: 40 }}>
          You can exit the app - we'll notify you once you're connected!
        </Typography>

        <Typography fontSize={14} fontWeight={'medium'} style={{ lineHeight: 20, textAlign: 'center' }}>
          This first time might take 30 seconds, 10 minutes, or even longer.
        </Typography>

        <Typography fontSize={14} style={{ lineHeight: 20, textAlign: 'center', marginTop: 25 }}>
          There's a good reason why it's slow: Quiet stores data on your community’s devices (not Big Tech’s servers!)
          and uses the battle-tested privacy tool Tor to protect your information. Tor is fast once connected, but can
          take a long time to connect at first.
        </Typography>

        <TouchableWithoutFeedback onPress={() => openUrl(Site.MAIN_PAGE)} testID={'learn-more-link'}>
          <Typography fontSize={14} style={{ lineHeight: 20, textAlign: 'center', marginTop: 40, color: '#2373EA' }}>
            Learn more about Tor and Quiet
          </Typography>
        </TouchableWithoutFeedback>
      </View>
    </View>
  )
}

export default ConnectionProcessComponent

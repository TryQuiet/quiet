import React, { FC } from 'react'
import { Image, View } from 'react-native'
import deviceInfoModule from 'react-native-device-info'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import { appImages } from '../../assets'

export const Splash: FC = () => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: defaultTheme.palette.background.white,
      }}
      testID='loading'
    >
      <Image
        source={appImages.quiet_icon}
        style={{
          marginTop: 20,
          marginBottom: 46,
          resizeMode: 'cover',
          width: 84,
          height: 84,
          borderRadius: 16,
        }}
      />
      <View style={{ gap: 6, alignItems: 'center' }}>
        <Typography fontSize={14} fontWeight={'medium'}>
          Starting backend
        </Typography>
        <Typography fontSize={12} color={'gray50'}>
          This can take some time
        </Typography>
      </View>
      <View style={{ margin: 20 }}>
        <Typography fontSize={12} color={'grayDark'}>
          {`v ${deviceInfoModule.getVersion()}`}
        </Typography>
      </View>
    </View>
  )
}

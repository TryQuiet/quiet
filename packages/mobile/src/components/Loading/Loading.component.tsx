import React, { FC } from 'react'
import { Image, View } from 'react-native'
import deviceInfoModule from 'react-native-device-info'
import * as Progress from 'react-native-progress'
import { appImages } from '../../assets'
import { defaultTheme } from '../../styles/themes/default.theme'
import { InitCheck } from '../InitCheck/InitCheck.component'
import { Typography } from '../Typography/Typography.component'

import { LoadingProps } from './Loading.types'

export const Loading: FC<LoadingProps> = ({ progress, description, checks }) => {
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
        source={appImages.quiet_icon_round}
        style={{
          margin: 20,
          resizeMode: 'cover',
          width: 84,
          height: 84,
        }}
      />
      <Typography fontSize={14} horizontalTextAlign={'center'} style={{ margin: 10, maxWidth: 200 }}>
        {description}
      </Typography>
      <View>
        {progress > 0 && progress < 0.95 && (
          <Progress.Bar progress={progress} color={defaultTheme.palette.main.brand} />
        )}
      </View>
      <View style={{ marginTop: 40, alignItems: 'flex-start' }}>
        {checks?.map(item => (
          <InitCheck key={item.event} event={item.event} passed={item.passed} />
        ))}
      </View>
      <View style={{ margin: 20 }}>
        <Typography fontSize={12} color={'grayDark'}>
          {`v ${deviceInfoModule.getVersion()}`}
        </Typography>
      </View>
    </View>
  )
}

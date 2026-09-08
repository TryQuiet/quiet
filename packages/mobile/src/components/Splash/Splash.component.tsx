import React, { FC } from 'react'
import { Image, View, TouchableWithoutFeedback } from 'react-native'
import deviceInfoModule from 'react-native-device-info'
import Config from 'react-native-config'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import { icons } from '../../assets'
import { NodeEnv } from '../../utils/const/NodeEnv.enum'
import { sendLogs } from '../../utils/sendLogs'
import { shareAllData } from '../../utils/shareAllData'

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
        source={icons.quiet_icon}
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

      {/* Starting the backend can stall before any other screen is reachable,
          which is exactly when alpha/dev testers need to grab diagnostics.
          Surface the same dev/alpha-only "Share logs" / "Share all data"
          helpers used on the joining screen (PR #3213), gated identically to
          non-production builds via Config.NODE_ENV. */}
      {Config.NODE_ENV !== NodeEnv.Production && (
        <View style={{ gap: 16, alignItems: 'center' }}>
          <TouchableWithoutFeedback onPress={() => void sendLogs()} testID={'share-logs-link'}>
            <Typography fontSize={14} style={{ color: '#2373EA' }}>
              Share logs
            </Typography>
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback onPress={() => void shareAllData()} testID={'share-all-data-link'}>
            <Typography fontSize={14} style={{ color: '#2373EA' }}>
              Share all data
            </Typography>
          </TouchableWithoutFeedback>
        </View>
      )}
    </View>
  )
}

import React, { FC } from 'react'
import { View } from 'react-native'

import QR from 'react-native-qrcode-svg'

import { Appbar } from '../Appbar/Appbar.component'
import { Button } from '../Button/Button.component'
import { Typography } from '../Typography/Typography.component'

import { defaultTheme } from '../../styles/themes/default.theme'

import { QRCodeProps } from './QRCode.types'

export const QRCode: FC<QRCodeProps> = ({ value, svgRef, shareCode, handleBackButton }) => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: defaultTheme.palette.background.white,
      }}
    >
      <Appbar title={'QR Code'} back={handleBackButton} />
      <View
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <View
          style={{
            margin: 16,
          }}
        >
          <QR value={value} size={172} getRef={svgRef} />
        </View>
        <View style={{ marginTop: 16, width: 340 }}>
          <Typography fontSize={14} fontWeight={'normal'} style={{ lineHeight: 20, textAlign: 'center' }}>
            This community QR code is private. If it is shared with someone, they can scan it with their camera to join
            this community.
          </Typography>
        </View>
        <View style={{ marginTop: 16, width: 124 }}>
          <Button title={'Share code'} onPress={shareCode} />
        </View>
      </View>
    </View>
  )
}

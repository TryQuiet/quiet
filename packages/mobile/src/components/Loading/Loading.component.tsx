import React, { FC } from 'react'
import { View } from 'react-native'
import { Typography } from '../Typography/Typography.component'

export interface LoadingProps {
  title: string
  caption?: string
  progress?: number
}

export const Loading: FC<LoadingProps> = ({ title, caption, progress = 220 }) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View style={{ width: 300, height: 4, backgroundColor: '#F0F0F0', borderRadius: 4 }}>
        <View style={{ backgroundColor: '#67BFD3', height: 4, width: progress, borderRadius: 4 }}></View>
      </View>
      <View style={{ flexDirection: 'column', gap: 8 }}>
        <Typography fontSize={14} style={{ lineHeight: 20, textAlign: 'center', marginTop: 8 }}>
          {title}
        </Typography>
        {caption && (
          <View style={{ width: 250 }}>
            <Typography fontSize={12} color={'gray50'} horizontalTextAlign={'center'}>
              {caption}
            </Typography>
          </View>
        )}
      </View>
    </View>
  )
}

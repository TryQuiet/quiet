import React, { FC } from 'react'
import { View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { truncateWords } from '../../utils/functions/truncateWords/truncateWords'
import { Typography } from '../Typography/Typography.component'
import { ChannelTileProps } from './ChannelTile.types'

export const ChannelTile: FC<ChannelTileProps> = ({ name, message }) => {
  return (
    <View
      style={{
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: defaultTheme.palette.background.gray06
      }}>
      <View
        style={{
          flexDirection: 'row',
          padding: 16
        }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            paddingRight: 12
          }}>
          <View
            style={{
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              backgroundColor: defaultTheme.palette.background.gray70
            }}>
            <Typography fontSize={14} color={'white'}>
              {name.slice(0, 2)}
            </Typography>
          </View>
        </View>
        <View style={{ flex: 10 }}>
          <View style={{ flexDirection: 'row', paddingBottom: 3 }}>
            <View style={{ alignSelf: 'flex-start' }}>
              <Typography fontSize={16} fontWeight={'medium'}>
                #{name}
              </Typography>
            </View>
            {/* <View
                style={{
                  alignSelf: 'flex-start',
                  paddingTop: 2,
                  paddingLeft: 8
                }}>
                <Typography fontSize={14} color={'subtitle'}>
                  {messageDisplayData.date}
                </Typography>
              </View> */}
          </View>
          <View style={{ flexShrink: 1 }}>
            <Typography fontSize={14} color={'gray50'}>
              {truncateWords(message, 11)}
            </Typography>
          </View>
        </View>
      </View>
    </View>
  )
}

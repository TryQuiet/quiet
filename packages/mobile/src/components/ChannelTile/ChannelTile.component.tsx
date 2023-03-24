import React, { FC } from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { truncateWords } from '../../utils/functions/truncateWords/truncateWords'
import { Typography } from '../Typography/Typography.component'
import { ChannelTileProps } from './ChannelTile.types'

export const ChannelTile: FC<ChannelTileProps> = ({
  name,
  address,
  message,
  date,
  unread,
  redirect
}) => {
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        redirect(address)
      }}>
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: defaultTheme.palette.background.gray06,
          padding: 16
        }}>
        <View
          style={{
            flexDirection: 'row'
          }}>
          <View style={{ flex: 1, alignItems: 'center', paddingRight: 12 }}>
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
          <View style={{ flex: 9, flexDirection: 'column' }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 8 }}>
                <Typography fontSize={16} fontWeight={'medium'}>
                  #{name}
                </Typography>
              </View>
              <View style={{ flex: 4, alignItems: 'flex-end' }}>
                {date && (
                  <Typography fontSize={14} color={unread ? 'blue' : 'subtitle'}>
                    {date}
                  </Typography>
                )}
              </View>
            </View>
            <View style={{ flexDirection: 'row', paddingTop: 3 }}>
              <View style={{ flex: 10 }}>
                {message && (
                  <Typography fontSize={14} color={'gray50'}>
                    {truncateWords(message, 11)}
                  </Typography>
                )}
              </View>
              <View style={{ flex: 2, alignItems: 'flex-end' }}>
                {unread && (
                  <View
                    style={{
                      width: 36,
                      height: 20,
                      backgroundColor: defaultTheme.palette.background.blue,
                      borderRadius: 100,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                    <Typography fontSize={12} color={'white'} fontWeight={'medium'}>
                      new
                    </Typography>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}

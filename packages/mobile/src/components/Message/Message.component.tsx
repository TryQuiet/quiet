import React, { FC } from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { Typography } from '../Typography/Typography.component'
import { MessageProps } from './Message.types'
import Jdenticon from 'react-native-jdenticon'
import { appImages } from '../../../assets'
import { MessageType } from '@quiet/state-manager'

export const Message: FC<MessageProps> = ({ data, pendingMessages }) => {
  const messageDisplayData = data[0]

  const infoMessage = messageDisplayData.type === MessageType.Info

  const pending: boolean = pendingMessages[messageDisplayData.id] !== undefined

    return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          paddingBottom: 30
        }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            paddingRight: 15
          }}>
          {infoMessage ? (
            <Image
            resizeMode='cover'
            resizeMethod='resize'
            source={appImages.quiet_icon}
            style={{ width: 37, height: 37 }}
          />
          ) : (
            <Jdenticon value={messageDisplayData.nickname} size={37} style={{ padding: 0 }} />
          )}
        </View>
        <View style={{ flex: 8 }}>
          <View style={{ flexDirection: 'row', paddingBottom: 3 }}>
            <View style={{ alignSelf: 'flex-start' }}>
              <Typography fontSize={16} fontWeight={'medium'} color={ pending ? 'lightGray' : 'main' }>
                {infoMessage ? 'Quiet' : messageDisplayData.nickname}
              </Typography>
            </View>
            <View
              style={{
                alignSelf: 'flex-start',
                paddingTop: 2,
                paddingLeft: 8
              }}>
              <Typography fontSize={14} color={'subtitle'}>
                {messageDisplayData.date}
              </Typography>
            </View>
          </View>
          <View style={{ flexShrink: 1 }}>
            {data.map((message, index) => {
              const isPendingMessage = pendingMessages[message.id] !== undefined

              const outerDivStyle = index > 0 ? classes.nextMessage : classes.firstMessage
              return (
                <View style={outerDivStyle} key={index}>
                  <Typography fontSize={14} color={ isPendingMessage ? 'lightGray' : 'main' }>{message.message}</Typography>
                </View>
              )
            })}
          </View>
        </View>
      </View>
    </View>
  )
}

const classes = StyleSheet.create({
  firstMessage: {
    paddingTop: 0
  },
  nextMessage: {
    paddingTop: 4
  }
})

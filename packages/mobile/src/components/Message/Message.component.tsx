import React, { FC } from 'react'
import { KeyboardAvoidingView, View, StyleSheet } from 'react-native'
import { Typography } from '../Typography/Typography.component'
import { MessageProps } from './Message.types'
import Jdenticon from 'react-native-jdenticon'

export const Message: FC<MessageProps> = ({ data }) => {
  const messageDisplayData = data[0]

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          paddingBottom: 30
        }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            paddingRight: 12
          }}>
          <Jdenticon
            value={messageDisplayData.nickname}
            size={38}
            style={{ padding: 0 }}
          />
        </View>
        <View style={{ flex: 10 }}>
          <View style={{ flexDirection: 'row', paddingBottom: 3 }}>
            <View style={{ alignSelf: 'flex-start' }}>
              <Typography fontSize={16} fontWeight={'medium'}>
                {messageDisplayData.nickname}
              </Typography>
            </View>
            <View
              style={{
                alignSelf: 'flex-start',
                paddingTop: 2,
                paddingLeft: 8
              }}>
              <Typography fontSize={14} color={'subtitle'}>
                {messageDisplayData.createdAt}
              </Typography>
            </View>
          </View>
          <View style={{ flexShrink: 1 }}>
            {data.map((message, index) => {
              const outerDivStyle = index > 0 ? classes.nextMessage : classes.firstMessage
              return (
                <View style={outerDivStyle}>
                  <Typography fontSize={14}>{message.message}</Typography>
                </View>
              )
            })}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
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

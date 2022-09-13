import React, { FC } from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { Typography } from '../Typography/Typography.component'
import { MessageProps } from './Message.types'
import Jdenticon from 'react-native-jdenticon'
import { appImages } from '../../../assets'
import { MessageType, AUTODOWNLOAD_SIZE_LIMIT, DisplayableMessage } from '@quiet/state-manager'
import { UploadedImage } from '../UploadedImage/UploadedImage.component'
import { UploadedFile } from '../UploadedFile/UploadedFile.component'
import { FileActionsProps } from '../UploadedFile/UploadedFile.types'

export const Message: FC<MessageProps & FileActionsProps> = ({ data, downloadStatus, downloadFile, cancelDownload }) => {
  const messageDisplayData = data[0]
  console.log('Download state;:', downloadStatus?.downloadState)
  const renderMessage = (message: DisplayableMessage) => {
    
    switch (message.type) {
      case 2: // MessageType.Image (cypress tests incompatibility with enums)
        const size = message?.media?.size
        const fileDisplay = !size || size < AUTODOWNLOAD_SIZE_LIMIT
        if (message.media?.ext === '.gif') return (<Typography fontSize={14}>Gifs not supported yet ({message.media?.name}{message.media?.ext})</Typography>)
        return (
          <>
            {fileDisplay ? (
              <UploadedImage media={message.media}/>
            ) : (
              <UploadedFile message={message} downloadStatus={downloadStatus} downloadFile={downloadFile} cancelDownload={cancelDownload}/>
              // <Typography fontSize={14}>{'User sent a large image'}</Typography>
            )}
          </>
        )
      case 4: // MessageType.File
        return (
          <UploadedFile message={message} downloadStatus={downloadStatus} downloadFile={downloadFile} cancelDownload={cancelDownload}/>
        )
      default:
        return (
          <Typography fontSize={14}>{message.message}</Typography>
        )
    }
  }

  const infoMessage = messageDisplayData.type === MessageType.Info

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
              <Typography fontSize={16} fontWeight={'medium'}>
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
              const outerDivStyle = index > 0 ? classes.nextMessage : classes.firstMessage
              return (
                <View style={outerDivStyle} key={index}>
                  {renderMessage(message)}
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

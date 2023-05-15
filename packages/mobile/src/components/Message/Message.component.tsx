import React, { FC, ReactNode } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { Typography } from '../Typography/Typography.component'
import { MessageProps } from './Message.types'
import { Jdenticon } from '../Jdenticon/Jdenticon.component'
import { appImages } from '../../../assets'
import { MessageType, AUTODOWNLOAD_SIZE_LIMIT, DisplayableMessage } from '@quiet/state-manager'
import { UploadedImage } from '../UploadedImage/UploadedImage.component'
import { UploadedFile } from '../UploadedFile/UploadedFile.component'
import { FileActionsProps } from '../UploadedFile/UploadedFile.types'
import { MathJaxSvg } from 'react-native-mathjax-html-to-svg'
import Markdown, { MarkdownIt } from '@jonasmerlin/react-native-markdown-display'
import { defaultTheme } from '../../styles/themes/default.theme'

export const Message: FC<MessageProps & FileActionsProps> = ({
  data, // Set of messages merged by sender
  downloadStatus,
  downloadFile,
  cancelDownload,
  openImagePreview,
  openUrl,
  pendingMessages
}) => {
  const renderMessage = (message: DisplayableMessage, pending: boolean) => {
    switch (message.type) {
      case 2: // MessageType.Image (cypress tests incompatibility with enums)
        const size = message?.media?.size
        const fileDisplay = !size || size < AUTODOWNLOAD_SIZE_LIMIT
        return (
          <>
            {fileDisplay ? (
              <UploadedImage media={message.media} openImagePreview={openImagePreview}/>
            ) : (
              <UploadedFile message={message} downloadStatus={downloadStatus} downloadFile={downloadFile} cancelDownload={cancelDownload}/>
            )}
          </>
        )
      case 4: // MessageType.File
        return (
          <UploadedFile message={message} downloadStatus={downloadStatus} downloadFile={downloadFile} cancelDownload={cancelDownload}/>
        )
      default:
        const color = pending ? 'lightGray' : 'main'

        const markdownRules = {
          image: (node, children, parent, styles) => {
            return (
              <Text key={node.key} style={styles.image}>
                ![{node.attributes.alt}]({node.attributes.src})
              </Text>
            )
          },
          link: (node, children, parent, styles) => {
            return (
              <Text
                key={node.key}
                style={styles.link}
                onPress={() => openUrl(node.attributes.href)}>
                {children}
              </Text>
            )
          }
        }

        const containsLatex = /\$\$(.+)\$\$/.test(message.message)
        if (containsLatex) {
          // Input sanitization. react-native-mathjax-html-to-svg throws error when provided with empty "$$$$"
          const sanitizedMathJax = message.message.replace(/\$\$(\s*)\$\$/g, '$$_$$')
          return (
            // @ts-expect-error (Property 'children' does not exist on type 'IntrinsicAttributes & Props')
            <MathJaxSvg
              fontSize={14}
              color={ defaultTheme.palette.typography[color] }
              fontCache={true}
            >{sanitizedMathJax}</MathJaxSvg>
          )
        }
        return (
          <Typography fontSize={14} color={color} testID={message.message}>
            <Markdown markdownit={md} style={markdownStyle} rules={markdownRules}>
              {message.message}
            </Markdown>
          </Typography>
        )
    }
  }

  const representativeMessage = data[0]

  const info = representativeMessage.type === MessageType.Info
  const pending: boolean = pendingMessages?.[representativeMessage.id] !== undefined

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
          {info ? (
            <Image
            resizeMode='cover'
            resizeMethod='resize'
            source={appImages.quiet_icon}
            style={{ width: 37, height: 37 }}
          />
          ) : (
            <Jdenticon value={representativeMessage.nickname} size={37} />
          )}
        </View>
        <View style={{ flex: 8 }}>
          <View style={{ flexDirection: 'row', paddingBottom: 3 }}>
            <View style={{ alignSelf: 'flex-start' }}>
              <Typography fontSize={16} fontWeight={'medium'} color={ pending ? 'lightGray' : 'main' }>
                {info ? 'Quiet' : representativeMessage.nickname}
              </Typography>
            </View>
            <View
              style={{
                alignSelf: 'flex-start',
                paddingTop: 2,
                paddingLeft: 8
              }}>
              <Typography fontSize={14} color={'subtitle'}>
                {representativeMessage.date}
              </Typography>
            </View>
          </View>
          <View style={{ flexShrink: 1 }}>
            {data.map((message: DisplayableMessage, index: number) => {
              const outerDivStyle = index > 0 ? classes.nextMessage : classes.firstMessage
              return (
                <View style={outerDivStyle} key={index}>
                  {renderMessage(message, pending)}
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

const markdownStyle = StyleSheet.create({
  blockquote: {
    color: defaultTheme.palette.typography.lightGray,
    backgroundColor: '#FFF',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 0
  },
  bullet_list_icon: {
    marginLeft: 0
  },
  ordered_list_icon: {
    marginLeft: 0
  },
  hr: {
    marginTop: 20,
    marginBottom: 20
  },
  link: {
    color: defaultTheme.palette.typography.link
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 0
  },
  table: {
    borderWidth: 0
  },
  th: {
    borderBottom: 'solid',
    borderBottomWidth: 1,
    borderColor: defaultTheme.palette.typography.veryLightGray
  },
  thead: {
    fontWeight: 'bold'
  },
  tr: {
    borderBottomWidth: 0
  }
})

const md = MarkdownIt({
  typographer: true,
  linkify: true
})

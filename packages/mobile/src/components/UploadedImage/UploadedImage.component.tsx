import React, { FC } from 'react'
import { ActivityIndicator, TouchableWithoutFeedback, Image, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { UploadedImageProps } from './UploadedImage.types'
import FastImage from 'react-native-fast-image'
import { Typography } from '../Typography/Typography.component'
import { appImages } from '../../../assets'
import { formatBytes } from '@quiet/state-manager'

export const UploadedImage: FC<UploadedImageProps> = ({ media, openImagePreview }) => {
  const { path, width, height } = media
  const maxWidth = width >= 400 ? 400 : width

  if (!path) return <ActivityIndicator size="small" color={defaultTheme.palette.main.brand} />

  if (media?.ext === '.gif') { // Tmp. GIFs slow down flat list
    return (
        <TouchableWithoutFeedback onPress={() => openImagePreview(media)}>
          <View style={{
            backgroundColor: defaultTheme.palette.background.white,
            maxWidth: '100%',
            marginTop: 8,
            padding: 16,
            borderRadius: 8,
            borderColor: defaultTheme.palette.typography.veryLightGray,
            borderStyle: 'solid',
            borderWidth: 1
          }}>

            <Typography fontSize={12} style={{ fontWeight: 'bold' }}>
              {media.name}
              {media.ext}
            </Typography>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={appImages.file_document}
                resizeMode='cover'
                resizeMethod='resize'
                style={{
                  width: 20,
                  height: 20,
                  marginRight: 5
                }}
              />
              <View>
              <Typography
                fontSize={12}
                style={{ lineHeight: 20, color: defaultTheme.palette.typography.grayDark }}>
                {media?.size ? formatBytes(media?.size) : 'Calculating size...'}
              </Typography>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      )
    }

  return (
    <TouchableWithoutFeedback onPress={() => openImagePreview(media)}>
      <FastImage
        source={{ uri: `file://${path}` }}
        style={{ maxWidth: maxWidth, aspectRatio: width / height }}
      />
    </TouchableWithoutFeedback>
  )
}

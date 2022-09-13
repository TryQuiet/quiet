import React, { FC } from 'react'
import { ActivityIndicator, TouchableWithoutFeedback, Image, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { UploadedImageProps } from './UploadedImage.types'
import FastImage from 'react-native-fast-image'
import { Typography } from '../Typography/Typography.component'
import { appImages } from '../../../assets'

export const UploadedImage: FC<UploadedImageProps> = ({ media, openImagePreview }) => {
  const { path, width, height } = media
  const maxWidth = width >= 400 ? 400 : width

  if (!path) return <ActivityIndicator size="small" color={defaultTheme.palette.main.brand} />

  if (media?.ext === '.gif') { // Tmp. GIFs slow down flat list
    return (
      <>
        <TouchableWithoutFeedback onPress={() => openImagePreview(media)}>
          <View style={{ flexDirection: 'row' }}>
            <Image
              source={appImages.file_document}
              resizeMode='cover'
              resizeMethod='resize'
              style={{
                width: 20,
                height: 20
              }}
            />
            <Typography fontSize={14}> ({media?.name}{media?.ext})</Typography>
          </View>
        </TouchableWithoutFeedback>
        </>
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

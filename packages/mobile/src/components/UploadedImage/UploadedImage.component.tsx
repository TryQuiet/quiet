import React, { FC } from 'react'
import { ActivityIndicator, TouchableWithoutFeedback, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { UploadedImageProps } from './UploadedImage.types'
import FastImage from 'react-native-fast-image'

export const UploadedImage: FC<UploadedImageProps> = ({ media, openImagePreview }) => {
  const {
    path,
    width,
    height
  } = media

  const maxWidth = width >= 400 ? 400 : width

  return (
    <View>
      {!path ? (
        <ActivityIndicator size='small' color={defaultTheme.palette.main.brand} />
      ) : (
        <TouchableWithoutFeedback onPress={() => openImagePreview(media)}>
          <FastImage
            source={{ uri: `file://${path}` }}
            style={{ maxWidth: maxWidth, aspectRatio: width / height }}
          />
        </TouchableWithoutFeedback>
      )}
    </View>
  )
}

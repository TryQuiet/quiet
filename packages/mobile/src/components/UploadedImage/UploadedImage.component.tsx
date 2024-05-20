import React, { FC } from 'react'
import { ActivityIndicator, TouchableWithoutFeedback, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { UploadedImageProps } from './UploadedImage.types'
import FastImage from 'react-native-fast-image'

export const UploadedImage: FC<UploadedImageProps> = ({ media, openImagePreview }) => {
  const { path, width, height } = media

  const aspectRatio = width && height ? width / height : undefined
  const maxWidth = width && width >= 400 ? 400 : width

  return (
    <View style={{ padding: 5 }}>
      {!path || !width || !height ? (
        <ActivityIndicator size='small' color={defaultTheme.palette.main.brand} />
      ) : (
        <TouchableWithoutFeedback onPress={() => openImagePreview(media)}>
          <View>
            <FastImage source={{ uri: `file://${path}` }} style={{ maxWidth, aspectRatio }} />
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  )
}

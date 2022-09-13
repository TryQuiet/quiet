import React, { FC } from 'react'
import { ActivityIndicator, TouchableWithoutFeedback } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { UploadedImageProps } from './UploadedImage.types'
import FastImage from 'react-native-fast-image'
import { Typography } from '../Typography/Typography.component'

export const UploadedImage: FC<UploadedImageProps> = ({ media, openImagePreview }) => {
  const { path, width, height } = media
  const maxWidth = width >= 400 ? 400 : width

  if (!path) return <ActivityIndicator size="small" color={defaultTheme.palette.main.brand} />

  if (media?.ext === '.gif') {
return (
    <TouchableWithoutFeedback onPress={() => openImagePreview(media)}>
      <Typography fontSize={14}>Gifs not supported yet ({media?.name}{media?.ext})</Typography>
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

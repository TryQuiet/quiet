import React, { FC } from 'react'
import { View, Image, ActivityIndicator } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { UploadedImageProps } from './UploadedImage.types'
import FastImage from 'react-native-fast-image'

export const UploadedImage: FC<UploadedImageProps> = ({ media }) => {
  const {path, width, height, ext} = media
  const maxWidth = width >= 400 ? 400 : width
  const maxHeight = height >= 400 ? 400 : height

  return (
    <>
    {path ? <FastImage
      source={{ uri: `file://${path}` }}
      style={{ maxWidth: maxWidth, maxHeight: maxHeight, aspectRatio: width / height }}/> : <ActivityIndicator size="large" color={defaultTheme.palette.main.brand} />}
      </>
  )
}

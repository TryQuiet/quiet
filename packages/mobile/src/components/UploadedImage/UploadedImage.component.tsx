import React, { FC } from 'react'
import { View, Image, ActivityIndicator } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { UploadedImageProps } from './UploadedImage.types'
import FastImage from 'react-native-fast-image'

export const UploadedImage: FC<UploadedImageProps> = ({ media }) => {
  const {path, width, height, ext} = media
  const maxWidth = width >= 200 ? 200 : width
  const maxHeight = height >= 200 ? 200 : height

  return (
    <>
    {path ? <FastImage
      source={{ uri: `file://${path}` }}
      style={{ maxWidth: maxWidth, maxHeight: maxHeight, aspectRatio: width / height }}/> : <ActivityIndicator size="small" color={defaultTheme.palette.main.brand} />}
      </>
  )
}

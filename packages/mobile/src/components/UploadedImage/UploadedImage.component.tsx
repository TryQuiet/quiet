import React, { FC } from 'react'
import { View, Image, ActivityIndicator } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { UploadedImageProps } from './UploadedImage.types'
import FastImage from 'react-native-fast-image'

export const UploadedImage: FC<UploadedImageProps> = ({ media }) => {
  const {path, width, height} = media
  const maxWidth = width >= 400 ? 400 : width

  return (
    <>
    {path ? <FastImage
      source={{ uri: `file://${path}` }}
      style={{ maxWidth: maxWidth, aspectRatio: width / height }}/> : <ActivityIndicator size="small" color={defaultTheme.palette.main.brand} />}
      </>
  )
}

import React, { FC } from 'react'
import { View, Image, ActivityIndicator } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { UploadedImageProps } from './UploadedImage.types'

export const UploadedImage: FC<UploadedImageProps> = ({ media }) => {
  const {path, width, height} = media
  const maxWidth = width >= 400 ? 400 : width
  const maxHeight = height >= 400 ? 400 : height
  return (
    <>
    {path ? <Image
      source={{ uri: `file://${path}` }}
      style={{ maxWidth: maxWidth, maxHeight: maxHeight, aspectRatio: width / height }}/> : <ActivityIndicator size="large" color={defaultTheme.palette.main.brand} />}
      </>
  )
}

import React, { FC } from 'react'
import { View } from 'react-native'
import { SafeAreaModal } from '../SafeAreaModal/SafeAreaModal.component'

import { FileMetadata } from '@quiet/types'
import FastImage from '@d11/react-native-fast-image'
import { Appbar } from '../../components/Appbar/Appbar.component'

import { createLogger } from '../../utils/logger'

const logger = createLogger('imagePreview:component')

interface ImagePreviewModalProps {
  imagePreviewData: FileMetadata
  currentChannelName: string
  resetPreviewData: () => void
}

export const ImagePreviewModal: FC<ImagePreviewModalProps> = ({
  imagePreviewData,
  currentChannelName,
  resetPreviewData,
}) => {
  // Using SafeAreaModal to ensure UI elements are properly positioned on devices with notches
  const { width, height } = imagePreviewData
  if (!imagePreviewData || !width || !height) {
    return null
  }
  return (
    <SafeAreaModal
      animationType='slide'
      transparent={false}
      visible={imagePreviewData !== null}
      onRequestClose={() => {
        logger.info('Modal has been closed.')
        resetPreviewData()
      }}
    >
      <View>
        <Appbar title={`#${currentChannelName}`} back={resetPreviewData} />
        <View style={{ padding: 5 }}>
          <FastImage source={{ uri: `file://${imagePreviewData.path}` }} style={{ aspectRatio: width / height }} />
        </View>
      </View>
    </SafeAreaModal>
  )
}

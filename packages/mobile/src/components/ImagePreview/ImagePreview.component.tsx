import React, { FC } from 'react'
import { Modal, View } from 'react-native'

import { FileMetadata } from '@quiet/types'
import FastImage from 'react-native-fast-image'
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
  const { width, height } = imagePreviewData
  if (!imagePreviewData || !width || !height) return null
  return (
    <Modal
      animationType='slide'
      transparent={false}
      visible={imagePreviewData !== null}
      onRequestClose={() => {
        logger.info('Modal has been closed.')
        resetPreviewData()
      }}
    >
      <Appbar title={`#${currentChannelName}`} back={resetPreviewData} />
      <View style={{ padding: 5 }}>
        <FastImage source={{ uri: `file://${imagePreviewData.path}` }} style={{ aspectRatio: width / height }} />
      </View>
    </Modal>
  )
}

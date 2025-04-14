import React, { FC } from 'react'
import { Modal, View } from 'react-native'

import { FileMetadata } from '@quiet/types'
import FastImage from 'react-native-fast-image'
import { Appbar } from '../Appbar/Appbar.component'

import { createLogger } from '../../utils/logger'

const logger = createLogger('imageAttachmentPreview:component')

interface ImageAttachmentPreviewModalProps {
  imageAttachmentPreviewData: FileMetadata
  currentChannelName: string
  resetPreviewData: () => void
}

export const ImageAttachmentPreviewModal: FC<ImageAttachmentPreviewModalProps> = ({
  imageAttachmentPreviewData,
  currentChannelName,
  resetPreviewData,
}) => {
  const { width, height } = imageAttachmentPreviewData
  if (!imageAttachmentPreviewData || !width || !height) return null
  return (
    <Modal
      animationType='slide'
      transparent={false}
      visible={imageAttachmentPreviewData !== null}
      onRequestClose={() => {
        logger.info('Modal has been closed.')
        resetPreviewData()
      }}
    >
      <Appbar title={`#${currentChannelName}`} back={resetPreviewData} />
      <View style={{ padding: 5 }}>
        <FastImage
          source={{ uri: `file://${imageAttachmentPreviewData.path}` }}
          style={{ aspectRatio: width / height }}
        />
      </View>
    </Modal>
  )
}

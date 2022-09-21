import React, { FC } from 'react'
import { Modal, View } from 'react-native'

import { FileMetadata } from '@quiet/state-manager'
import FastImage from 'react-native-fast-image'
import { Appbar } from '../../components/Appbar/Appbar.component'

interface ImagePreviewModalProps {
  imagePreviewData: FileMetadata
  currentChannelName: string
  resetPreviewData: () => void
}

export const ImagePreviewModal: FC<ImagePreviewModalProps> = ({ imagePreviewData, currentChannelName, resetPreviewData }) => {
  return (imagePreviewData && <Modal
    animationType="slide"
    transparent={false}
    visible={imagePreviewData !== null}
    onRequestClose={() => {
      console.log('Modal has been closed.')
      resetPreviewData()
    }}
    >
      <Appbar title={`#${currentChannelName}`} back={resetPreviewData} />
      <View style={{ padding: 5 }}>
        <FastImage
          source={{ uri: `file://${imagePreviewData.path}` }}
          style={{ aspectRatio: imagePreviewData.width / imagePreviewData.height }}
        />
      </View>
    </Modal>
  )
}

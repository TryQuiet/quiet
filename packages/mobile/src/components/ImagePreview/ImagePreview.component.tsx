import React, { FC } from 'react'
import { Modal, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
  // IMPORTANT: When using React Native's Modal component, always use useSafeAreaInsets
  // to ensure UI elements are properly positioned on devices with notches or home indicators.
  // Without this, elements near the top (like back buttons) may be inaccessible on iOS devices.
  const insets = useSafeAreaInsets()
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
      {/* Apply paddingTop with safe area insets to ensure the Appbar is within the safe area */}
      <View style={{ paddingTop: insets.top }}>
        <Appbar title={`#${currentChannelName}`} back={resetPreviewData} />
        <View style={{ padding: 5 }}>
          <FastImage source={{ uri: `file://${imagePreviewData.path}` }} style={{ aspectRatio: width / height }} />
        </View>
      </View>
    </Modal>
  )
}

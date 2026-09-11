import React, { FC, ReactNode } from 'react'
import { Modal, ModalProps, ViewStyle } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

interface SafeAreaModalProps extends ModalProps {
  children: ReactNode
  contentStyle?: ViewStyle
}

/**
 * A Modal component that handles system bars and display cutouts in its own window.
 * Always use this component instead of React Native's Modal directly.
 */
export const SafeAreaModal: FC<SafeAreaModalProps> = ({ children, contentStyle, ...modalProps }) => {
  return (
    <Modal {...modalProps}>
      <SafeAreaProvider>
        <SafeAreaView style={[{ flex: 1 }, contentStyle]}>{children}</SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  )
}

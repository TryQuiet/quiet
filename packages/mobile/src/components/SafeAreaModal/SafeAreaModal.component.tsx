import React, { FC, ReactNode } from 'react'
import { Modal, ModalProps, View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface SafeAreaModalProps extends ModalProps {
  children: ReactNode
  contentStyle?: ViewStyle
}

/**
 * A Modal component that properly handles safe area insets for iOS devices with notches.
 * Always use this component instead of React Native's Modal directly.
 */
export const SafeAreaModal: FC<SafeAreaModalProps> = ({ children, contentStyle, ...modalProps }) => {
  // Get safe area insets to handle notched devices properly
  const insets = useSafeAreaInsets()

  return (
    <Modal {...modalProps}>
      <View style={[{ paddingTop: insets.top }, contentStyle]}>{children}</View>
    </Modal>
  )
}

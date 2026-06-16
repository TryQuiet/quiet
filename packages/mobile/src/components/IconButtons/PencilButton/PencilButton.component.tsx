import React, { FC } from 'react'
import { FAB } from 'react-native-paper'
import { defaultTheme } from '../../../styles/themes/default.theme'
import type { PencilButtonProps } from './PencilButton.types'

export const PencilButton: FC<PencilButtonProps> = ({
  onPress,
  size = 56,
  iconColor = defaultTheme.palette.typography.white,
  backgroundColor = defaultTheme.palette.typography.darkPurple,
  rippleColor = defaultTheme.palette.background.lightPurple,
}) => {
  return (
    <FAB
      icon='pencil-outline'
      onPress={onPress}
      style={{
        position: 'absolute',
        margin: 16,
        marginBottom: 24,
        bottom: 0,
        right: 0,
        backgroundColor,
        borderRadius: 100,
      }}
      mode={'flat'}
      customSize={size}
      color={iconColor}
      background={{ color: rippleColor, borderless: true, radius: 100 }}
    />
  )
}

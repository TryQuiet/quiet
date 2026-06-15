import React, { FC } from 'react'
import { Button, Icon, IconButton } from 'react-native-paper'
import { defaultTheme } from '../../../styles/themes/default.theme'
import type { PencilButtonProps } from './PencilButton.types'

export const PencilButton: FC<PencilButtonProps> = ({
  onPress,
  size = 48,
  iconColor = defaultTheme.palette.typography.white,
  backgroundColor = defaultTheme.palette.typography.darkPurple,
}) => {
  const iconSize = size / 2
  return (
    <IconButton
      icon='pencil-outline'
      mode={'contained'}
      onPress={onPress}
      size={iconSize}
      style={{ height: size, width: size, borderRadius: 100 }}
      iconColor={iconColor}
      containerColor={backgroundColor}
    />
  )
}

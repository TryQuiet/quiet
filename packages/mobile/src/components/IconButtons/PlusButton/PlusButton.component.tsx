import React, { FC } from 'react'
import { Button, IconButton } from 'react-native-paper'
import { defaultTheme } from '../../../styles/themes/default.theme'
import type { PlusButtonProps } from './PlusButton.types'

export const PlusButton: FC<PlusButtonProps> = ({
  onPress,
  iconColor = defaultTheme.palette.typography.gray70,
  size = 20,
}) => {
  return <IconButton icon='plus-circle-outline' onPress={onPress} iconColor={iconColor} size={size} />
}

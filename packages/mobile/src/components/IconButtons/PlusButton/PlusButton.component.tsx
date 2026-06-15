import React, { FC } from 'react'
import { Button } from 'react-native-paper'
import { defaultTheme } from '../../../styles/themes/default.theme'
import type { PlusButtonProps } from './PlusButton.types'

export const PlusButton: FC<PlusButtonProps> = ({
  onPress,
  size = 16,
  iconColor = defaultTheme.palette.typography.grayLight,
}) => {
  return (
    <Button
      icon='plus-circle-outline'
      mode={'text'}
      onPress={onPress}
      // style={{ width: size, height: size }}
      textColor={iconColor}
      compact={true}
    >
      {''}
    </Button>
  )
}

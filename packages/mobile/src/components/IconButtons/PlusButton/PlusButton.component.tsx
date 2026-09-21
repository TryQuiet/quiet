import React, { FC } from 'react'
import { IconButton } from 'react-native-paper'
import { defaultTheme } from '../../../styles/themes/default.theme'
import type { PlusButtonProps } from './PlusButton.types'

/** The smallest comfortable finger target; every guideline puts it at 44, Android Material at 48. */
const TOUCH_TARGET = 48

export const PlusButton: FC<PlusButtonProps> = ({
  onPress,
  accessibilityLabel,
  iconColor = defaultTheme.palette.typography.gray70,
  size = 20,
}) => {
  return (
    <IconButton
      icon='plus-circle-outline'
      onPress={onPress}
      iconColor={iconColor}
      size={size}
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      // Paper sizes the Surface at `size + 16` and adds a 6pt margin, so a 20pt glyph is a 36x36
      // target sitting in a 48pt footprint. The Surface sets overflow:'hidden', which clips the
      // hitSlop Paper puts on the TouchableRipple inside it, so that slop never sees a touch.
      // Claiming the whole footprint instead — no margin, an explicit 48 box — gets the target to
      // 48 without moving the row or changing the glyph.
      style={{ width: TOUCH_TARGET, height: TOUCH_TARGET, borderRadius: TOUCH_TARGET / 2, margin: 0 }}
    />
  )
}

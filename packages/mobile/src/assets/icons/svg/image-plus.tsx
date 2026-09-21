import React, { memo } from 'react'
import Svg, { Path } from 'react-native-svg'
import type { StyleProp, ViewStyle } from 'react-native'

export interface ImagePlusIconProps {
  size?: number
  color?: string
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
  testID?: string
}

/**
 * "image-plus-outline" — the glyph the designs put on the avatar's edit control (Figma
 * BnANosC1KGMUvm8oU2Dr0i, Avatar-action in 805:21301). Exported from that node rather than drawn
 * by hand: a picture frame with a plus is not something two rectangles approximate.
 */
const ImagePlusIcon: React.FC<ImagePlusIconProps> = memo(function ImagePlusIcon({
  size = 20,
  color = '#000000',
  style,
  accessibilityLabel,
  testID,
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 20 20'
      fill='none'
      style={style}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Path
        d='M10 16C10 16.7 10.13 17.37 10.35 18H2C0.9 18 0 17.11 0 16V2C0 0.9 0.9 0 2 0H16C17.11 0 18 0.9 18 2V10.35C17.37 10.13 16.7 10 16 10V2H2V16H10ZM10.96 9.29L8.21 12.83L6.25 10.47L3.5 14H10.35C10.75 12.88 11.47 11.91 12.4 11.21L10.96 9.29ZM17 15V12H15V15H12V17H15V20H17V17H20V15H17Z'
        fill={color}
      />
    </Svg>
  )
})

export default ImagePlusIcon

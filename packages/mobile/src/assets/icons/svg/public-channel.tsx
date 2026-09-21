import React, { memo } from 'react'
import Svg, { Path } from 'react-native-svg'
import { defaultTheme } from '../../../styles/themes/default.theme'
import type { StyleProp, ViewStyle } from 'react-native'

export interface PublicChannelIconProps {
  size?: number
  color?: string
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
  testID?: string
  bold?: boolean
}

const PublicChannelIcon: React.FC<PublicChannelIconProps> = memo(function LockIcon({
  size = 24,
  color = defaultTheme.palette.typography.main,
  style,
  accessibilityLabel,
  testID,
  bold = false,
}) {
  const strokeWidth = bold ? '3' : '2'
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      style={style}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Path d='M15.7318 4.875L12.8818 19.125' stroke={color} strokeWidth={strokeWidth} strokeLinecap='round' />
      <Path d='M10.5355 4.875L7.68555 19.125' stroke={color} strokeWidth={strokeWidth} strokeLinecap='round' />
      <Path d='M6.8252 8.58594H17.7502' stroke={color} strokeWidth={strokeWidth} strokeLinecap='round' />
      <Path d='M5.875 15.4141H16.8' stroke={color} strokeWidth={strokeWidth} strokeLinecap='round' />
    </Svg>
  )
})

export default PublicChannelIcon

import React, { memo } from 'react'
import Svg, { Path, Mask } from 'react-native-svg'
import { defaultTheme } from '../../../styles/themes/default.theme'
import type { StyleProp, ViewStyle } from 'react-native'

export interface LockIconProps {
  size?: number
  color?: string
  fill?: boolean
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
  testID?: string
}

const LockIcon: React.FC<LockIconProps> = memo(function LockIcon({
  size = 24,
  color = defaultTheme.palette.typography.main,
  fill,
  style,
  accessibilityLabel,
  testID,
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill={fill ? color : 'none'}
      style={style}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Mask id='a' fill='#fff'>
        <Path d='M5.5 11.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z' />
      </Mask>
      <Path
        stroke={color}
        strokeWidth='4'
        d='M5.5 11.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z'
        mask='url(#a)'
      />
      <Path
        fill={color}
        fillRule='evenodd'
        strokeWidth='4'
        d='M7.5 10.5h2V7a2.5 2.5 0 0 1 5 0v3.5h2V7a4.5 4.5 0 1 0-9 0z'
        clipRule='evenodd'
      />
    </Svg>
  )
})

export default LockIcon

import React, { memo } from 'react'
import Svg, { Circle, G, Path } from 'react-native-svg'
import { defaultTheme } from '../../../styles/themes/default.theme'

/**
 * The Quiet Design Library's small ("st-"/"t-") glyphs for the Community home
 * list, exported from Figma file 0j7Nna9zWmfOSNmRmQK1Uh (Structure & Nav,
 * Community home 5446:76594) at the sizes the design uses them: 12px row
 * glyphs, 16px section and title-bar glyphs. Paths and the library's glyph
 * opacity are verbatim; the 24px lock/public-channel icons elsewhere in the app
 * are a different, larger drawing of the same marks.
 */

export interface CommunityHomeIconProps {
  size?: number
  color?: string
}

const GLYPH_COLOR = '#222222'

/** `st-#-public` — the public channel hash, drawn for a 12px box. */
export const ChannelPublicIcon: React.FC<CommunityHomeIconProps> = memo(function ChannelPublicIcon({
  size = 12,
  color = GLYPH_COLOR,
}) {
  return (
    <Svg width={size} height={size} viewBox='0 0 12 12' fill='none'>
      <G opacity={0.5}>
        <Path d='M8.47578 1.5L6.67578 10.5' stroke={color} strokeWidth={1} strokeLinecap='round' />
        <Path d='M5.19453 1.5L3.39453 10.5' stroke={color} strokeWidth={1} strokeLinecap='round' />
        <Path d='M2.85156 3.84375H9.75156' stroke={color} strokeWidth={1} strokeLinecap='round' />
        <Path d='M2.25 8.15625H9.15209' stroke={color} strokeWidth={1} strokeLinecap='round' />
      </G>
    </Svg>
  )
})

/** `st-#-private` — the padlock that marks a private channel, for a 12px box. */
export const ChannelPrivateIcon: React.FC<CommunityHomeIconProps> = memo(function ChannelPrivateIcon({
  size = 12,
  color = GLYPH_COLOR,
}) {
  return (
    <Svg width={size} height={size} viewBox='0 0 12 12' fill='none'>
      <G opacity={0.5}>
        <Path
          d='M1.92969 5.646C1.92969 5.09371 2.3774 4.646 2.92969 4.646L9.06954 4.646C9.62182 4.646 10.0695 5.09371 10.0695 5.646L10.0695 10.1579C10.0695 10.7102 9.62182 11.1579 9.06954 11.1579L2.92969 11.1579C2.3774 11.1579 1.92969 10.7102 1.92969 10.1579L1.92969 5.646Z'
          fill={color}
        />
        <Path
          d='M4.03125 5.45997V3.08131C4.03125 1.96972 4.91224 1.0686 5.999 1.0686C7.08576 1.0686 7.96675 1.96972 7.96675 3.08131V5.45997'
          stroke={color}
          strokeWidth={1}
        />
      </G>
    </Svg>
  )
})

/** `st-person-add-2` — the Add members glyph, for a 12px box. */
export const PersonAddSmallIcon: React.FC<CommunityHomeIconProps> = memo(function PersonAddSmallIcon({
  size = 12,
  color = GLYPH_COLOR,
}) {
  return (
    <Svg width={size} height={size} viewBox='0 0 12 12' fill='none'>
      <G opacity={0.5}>
        <Circle cx={4.5} cy={4} r={1.5} stroke={color} strokeWidth={1} />
        <Path d='M9.5 3.5C9.5 4.67157 9.5 6.5 9.5 6.5' stroke={color} strokeWidth={0.75} strokeLinecap='round' />
        <Path d='M11 5C9.82843 5 8 5 8 5' stroke={color} strokeWidth={0.75} strokeLinecap='round' />
        <Path
          d='M7.82375 8.77097C7.2907 7.40505 5.66103 6.86719 4.5 6.86719C3.33611 6.86719 1.70127 7.3863 1.17233 8.77001C0.975132 9.28589 1.44742 9.75 1.99971 9.75H4.5H7.00012C7.5524 9.75 8.02453 9.28547 7.82375 8.77097Z'
          stroke={color}
          strokeWidth={1}
        />
      </G>
    </Svg>
  )
})

/** `t-add` — the circled plus at the end of a section title, for a 16px box. */
export const AddCircleIcon: React.FC<CommunityHomeIconProps> = memo(function AddCircleIcon({
  size = 16,
  color = GLYPH_COLOR,
}) {
  return (
    <Svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
      <G opacity={0.6}>
        <Path d='M8 4V12' stroke={color} strokeWidth={1} />
        <Path d='M12 8L4 8' stroke={color} strokeWidth={1} />
        <Circle cx={8} cy={8} r={7.5} stroke={color} strokeWidth={1} />
      </G>
    </Svg>
  )
})

/** `t-caret-down-dark` — the community switcher caret in the title bar, 16px. */
export const CaretDownIcon: React.FC<CommunityHomeIconProps> = memo(function CaretDownIcon({
  size = 16,
  color = defaultTheme.palette.typography.white,
}) {
  return (
    <Svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
      <G opacity={0.6}>
        <Path
          d='M11.5246 7.09375H4.47265C4.2937 7.09375 4.20482 7.31075 4.33234 7.43628L7.84462 10.8937C7.92224 10.9701 8.04674 10.9703 8.12467 10.8942L11.6644 7.43683C11.7927 7.31153 11.704 7.09375 11.5246 7.09375Z'
          fill={color}
        />
      </G>
    </Svg>
  )
})

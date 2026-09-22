import { TextStyle } from 'react-native'
import { defaultPalette } from '../../styles/palettes/default.palette'
import type { TypeVariant } from '../../styles/const/typography'

export type FontWeight = 'bold' | 'medium' | 'thin' | 'normal'

export interface TypographyProps {
  onPress?: () => void
  color?: keyof typeof defaultPalette['typography']
  /** Role on the 4px type scale (styles/const/typography.ts). Sets size, line height and weight. */
  variant?: TypeVariant
  /** Raw size; overrides the variant's size. Kept for the components not yet on the scale. */
  fontSize?: number
  fontWeight?: FontWeight
  lineHeight?: number
  horizontalTextAlign?: TextStyle['textAlign']
  verticalTextAlign?: TextStyle['textAlignVertical']
  numberOfLines?: number
  style?: TextStyle
}

export type StyledTypographyProps = TypographyProps

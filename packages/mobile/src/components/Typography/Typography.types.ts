import { TextStyle } from 'react-native'
import { defaultPalette } from '../../styles/palettes/default.palette'

export type FontWeight = 'bold' | 'medium' | 'thin' | 'normal'

export interface TypographyProps {
  onPress?: () => void
  color?: keyof typeof defaultPalette['typography']
  fontSize?: number
  fontWeight?: FontWeight
  horizontalTextAlign?: TextStyle['textAlign']
  verticalTextAlign?: TextStyle['textAlignVertical']
  numberOfLines?: number
  style?: TextStyle
}

export type StyledTypographyProps = TypographyProps

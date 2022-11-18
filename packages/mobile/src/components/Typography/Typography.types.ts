import { TextStyle } from 'react-native'
// import {Palette} from 'styled-components';

export type FontWeight = 'bold' | 'medium' | 'thin' | 'normal'

export interface TypographyProps {
  // color?: keyof Palette['typography'];
  onPress?: () => void
  color?: string
  fontSize: number
  fontWeight?: FontWeight
  horizontalTextAlign?: TextStyle['textAlign']
  verticalTextAlign?: TextStyle['textAlignVertical']
  numberOfLines?: number
  style?: TextStyle
}

export interface StyledTypographyProps extends TypographyProps {}

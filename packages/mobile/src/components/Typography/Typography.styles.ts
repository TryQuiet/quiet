import { Text } from 'react-native'
import styled, { css } from 'styled-components/native'
import { StyledTypographyProps } from './Typography.types'
import { getFontFamily } from './Typography.utils'
import { defaultTheme } from '../../styles/themes/default.theme'

export const StyledTypography = styled(Text).attrs((props: StyledTypographyProps) => ({
  color: props.color ?? 'main',
  horizontalTextAlign: props.horizontalTextAlign ?? 'left',
  verticalTextAlign: props.verticalTextAlign ?? 'center',
}))<StyledTypographyProps>`
  ${({ fontSize, fontWeight, color, verticalTextAlign, horizontalTextAlign }) => css`
    color: ${defaultTheme.palette.typography[color]};
    font-family: ${getFontFamily(fontWeight)};
    font-size: ${fontSize}px;
    text-align: ${horizontalTextAlign};
    text-align-vertical: ${verticalTextAlign};
  `}
`

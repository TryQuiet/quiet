import React, { FC } from 'react'

import { TextProps } from 'react-native'

import { StyledTypography } from './Typography.styles'
import { TypographyProps } from './Typography.types'

export const Typography: FC<TypographyProps & TextProps> = ({
  onPress,
  children,
  fontSize,
  fontWeight,
  color,
  style,
  horizontalTextAlign,
  verticalTextAlign,
  numberOfLines,
  ...props
}) => (
  <StyledTypography
    onPress={onPress}
    color={color}
    fontSize={fontSize}
    fontWeight={fontWeight}
    horizontalTextAlign={horizontalTextAlign}
    numberOfLines={numberOfLines}
    style={style}
    verticalTextAlign={verticalTextAlign}
    {...props}>
    {children}
  </StyledTypography>
)

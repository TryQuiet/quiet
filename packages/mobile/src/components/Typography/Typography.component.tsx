import React, { FC } from 'react'

import { StyledTypography } from './Typography.styles'
import { TypographyProps } from './Typography.types'

export const Typography: FC<TypographyProps> = ({
  onPress,
  children,
  fontSize,
  fontWeight,
  color,
  style,
  horizontalTextAlign,
  verticalTextAlign,
  numberOfLines
}) => (
  <StyledTypography
    onPress={onPress}
    color={color}
    fontSize={fontSize}
    fontWeight={fontWeight}
    horizontalTextAlign={horizontalTextAlign}
    numberOfLines={numberOfLines}
    style={style}
    verticalTextAlign={verticalTextAlign}>
    {children}
  </StyledTypography>
)

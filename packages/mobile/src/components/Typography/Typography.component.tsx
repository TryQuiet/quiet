import React, { FC } from 'react'

import { TextProps } from 'react-native'

import { StyledTypography } from './Typography.styles'
import { TypographyProps } from './Typography.types'
import { typeScale } from '../../styles/const/typography'

export const Typography: FC<TypographyProps & TextProps> = ({
  onPress,
  children,
  variant,
  fontSize,
  fontWeight,
  lineHeight,
  color,
  style,
  horizontalTextAlign,
  verticalTextAlign,
  numberOfLines,
  ...props
}) => {
  const scale = variant ? typeScale[variant] : undefined
  const resolvedLineHeight = lineHeight ?? scale?.lineHeight
  return (
    <StyledTypography
      onPress={onPress}
      color={color}
      fontSize={fontSize ?? scale?.fontSize}
      fontWeight={fontWeight ?? scale?.fontWeight}
      {...(resolvedLineHeight != null ? { lineHeight: resolvedLineHeight } : {})}
      horizontalTextAlign={horizontalTextAlign}
      numberOfLines={numberOfLines}
      style={style}
      verticalTextAlign={verticalTextAlign}
      {...props}
    >
      {children}
    </StyledTypography>
  )
}

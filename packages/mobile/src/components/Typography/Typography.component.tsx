import React, {FC} from 'react';

import {StyledTypography} from './Typography.styles';
import {TypographyProps} from './Typography.types';

export const Typography: FC<TypographyProps> = ({
  children,
  fontSize,
  fontWeight,
  color,
  style,
  horizontalTextAlign,
  verticalTextAlign,
  numberOfLines,
}) => (
  <StyledTypography
    color={color}
    fontSize={fontSize}
    fontWeight={fontWeight}
    horizontalTextAlign={horizontalTextAlign}
    numberOfLines={numberOfLines}
    style={style}
    verticalTextAlign={verticalTextAlign}>
    {children}
  </StyledTypography>
);

import React, { FC } from 'react';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { StyledButton } from './Button.styles';

import { ButtonProps } from './Button.types';

export const Button: FC<ButtonProps> = ({ title, onPress, style }) => {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <StyledButton style={style}>{title}</StyledButton>
    </TouchableWithoutFeedback>
  );
};

import React, { FC } from 'react';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { StyledButton } from './Button.styles';
import { ButtonProps } from './Button.types';

import * as Progress from 'react-native-progress';

export const Button: FC<ButtonProps> = ({ onPress, title, loading, style }) => {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      {loading && (
        <StyledButton style={style}>
          <Progress.CircleSnail color={['white']} size={18} thickness={1.5} />
        </StyledButton>
      )}
      {!loading && <StyledButton style={style}>{title}</StyledButton>}
    </TouchableWithoutFeedback>
  );
};

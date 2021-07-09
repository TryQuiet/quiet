import { Text } from 'react-native';
import styled, { css } from 'styled-components/native';
import { getFontFamily } from '../Typography/Typography.utils';

export const StyledButton = styled(Text)`
  ${({ theme }) =>
    css`
      padding: 12px 0px;
      height: 42px;
      color: ${theme.palette.main.white};
      background-color: ${theme.palette.main.brand};
      text-align: center;
      font-family: ${getFontFamily('normal')};
      border-radius: 5px;
    `}
`;

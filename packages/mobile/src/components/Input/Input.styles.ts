import { Pressable, TextInput } from 'react-native';
import styled, { css } from 'styled-components/native';

export const StyledTextInput = styled(TextInput)`
  text-align-vertical: center;
  padding-top: 8px;
  padding-bottom: 8px;
`;

export const StyledWrapper = styled(Pressable)<{
  isCommentScreen: boolean;
}>`
  ${({ theme }) => css`
    min-height: 42px;
    max-height: 72px;
    border-color: ${theme.palette.input.border};
    border-radius: 4px;
    border-width: 1px;
    padding-left: 15px;
    padding-right: 15px;
    flex-grow: 1;
  `}
`;

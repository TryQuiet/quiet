import { Pressable, TextInput } from 'react-native'
import styled, { css } from 'styled-components/native'

export const StyledTextInput = styled(TextInput)`
  text-align-vertical: center;
  padding-top: 12px;
  padding-bottom: 12px;
`

export const StyledWrapper = styled(Pressable)<{
  disabled: boolean
}>`
  ${({ theme, disabled }) => css`
    background-color: ${disabled
      ? theme.palette.input.backgroundDisabled
      : theme.palette.input.backgroundDefault};
    border-color: ${theme.palette.input.border};
    border-radius: 4px;
    border-width: 1px;
    padding-left: 15px;
    padding-right: 15px;
    flex-grow: 1;
  `}
`

import { Platform, Pressable, TextInput } from 'react-native'
import styled, { css } from 'styled-components/native'

export const StyledTextInput = styled(TextInput)`
  text-align-vertical: center;
  ${Platform.select({
    ios: {
        paddingTop: 12,
        paddingBottom: 12
    },
    android: {}
})}
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

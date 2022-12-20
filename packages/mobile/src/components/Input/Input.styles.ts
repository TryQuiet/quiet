import { Platform, Pressable, TextInput } from 'react-native'
import styled, { css } from 'styled-components/native'
import { defaultTheme } from '../../styles/themes/default.theme'

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
  ${({ disabled }) => css`
    background-color: ${disabled
      ? defaultTheme.palette.input.backgroundDisabled
      : defaultTheme.palette.input.backgroundDefault};
    border-color: ${defaultTheme.palette.input.border};
    border-radius: 4px;
    border-width: 1px;
    padding-left: 15px;
    padding-right: 15px;
    flex-grow: 1;
  `}
`

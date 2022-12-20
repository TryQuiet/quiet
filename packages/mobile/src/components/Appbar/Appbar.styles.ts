
import { View } from 'react-native'
import styled, { css } from 'styled-components/native'
import { defaultTheme } from '../../styles/themes/default.theme'

export const StyledAppbar = styled(View)`
  ${() => css`
    min-height: 52px;
    max-height: 52px;
    background-color: ${defaultTheme.palette.background.white};
    border-bottom-color: ${defaultTheme.palette.background.gray06};
    border-bottom-width: 1px;
    flex-grow: 1;
    flex-direction: row;
  `}
`

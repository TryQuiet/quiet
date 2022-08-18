
import { View } from 'react-native'
import styled, { css } from 'styled-components/native'

export const StyledAppbar = styled(View)`
  ${({ theme }) => css`
    min-height: 52px;
    max-height: 52px;
    background-color: ${theme.palette.background.white};
    border-bottom-color: ${theme.palette.appBar.gray};
    border-bottom-width: 1px;
    flex-grow: 1;
    flex-direction: row;
  `}
`

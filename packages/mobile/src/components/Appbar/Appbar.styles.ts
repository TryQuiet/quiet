import { View } from 'react-native'
import styled, { css } from 'styled-components/native'
import { defaultTheme } from '../../styles/themes/default.theme'

export const StyledAppbar = styled(View)`
  ${() => css`
    /* "Panel header" (Figma PVQ1Kjf6Cq8ng1czuVtvR8, 3606:13240): 60 tall, 64 when the title
       carries a subtitle — as the chat and membership bars now do. The ceiling keeps a long
       channel name from growing the bar instead of clipping. */
    min-height: 60px;
    max-height: 64px;
    background-color: ${defaultTheme.palette.background.white};
    border-bottom-color: ${defaultTheme.palette.background.gray06};
    border-bottom-width: 1px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  `}
`

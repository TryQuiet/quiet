import { Platform, Pressable, TextInput } from 'react-native'
import styled, { css } from 'styled-components/native'
import { defaultTheme } from '../../styles/themes/default.theme'

/** "Input 2.0 base" (Figma PVQ1Kjf6Cq8ng1czuVtvR8, 838:9422): 48 tall at radius 16. */
export const INPUT_HEIGHT = 48
export const INPUT_RADIUS = 16
/** Floor for a growing multiline field; the chat composer is the only one. */
export const COMPOSE_MIN_HEIGHT = 54

export const StyledTextInput = styled(TextInput)<{
  height: number
  multiline?: boolean
}>`
  ${({ height, multiline }) => css`
    text-align-vertical: center;
    flex: 1;
    /* Only a growing multiline field measures its own height. A single-line field takes the
       wrapper's, which is now shorter than the 40px floor this used to impose on both. */
    ${multiline ? `height: ${Math.max(40, height)}px;` : ''}
    ${Platform.select({
      ios: {
        paddingTop: 12,
        paddingBottom: multiline ? 0 : 12,
      },
      android: {},
    })}
  `}
`

export const StyledWrapper = styled(Pressable)<{
  disabled: boolean
  focused: boolean
  invalid: boolean
}>`
  ${({ disabled, focused, invalid }) => css`
    background-color: ${disabled
      ? defaultTheme.palette.input.backgroundDisabled
      : defaultTheme.palette.input.backgroundDefault};
    border-color: ${disabled
      ? defaultTheme.palette.input.borderDisabled
      : invalid
      ? defaultTheme.palette.input.borderError
      : focused
      ? defaultTheme.palette.input.borderFocus
      : defaultTheme.palette.input.border};
    border-radius: ${INPUT_RADIUS}px;
    border-width: 1px;
    padding-left: 16px;
    padding-right: 16px;
    height: ${INPUT_HEIGHT}px;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    flex-grow: 1;
  `}
`

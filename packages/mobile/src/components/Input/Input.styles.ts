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
  ${({ multiline }) => css`
    text-align-vertical: center;
    flex: 1;
    /*
     * A multiline input must keep an auto height. Its own box is what React Native measures to
     * produce onContentSizeChange, so pinning that box to the last reported height freezes the
     * measurement: on Android a definite height stops Yoga consulting
     * ReactTextInputShadowNode.measure(), the view is never re-laid-out, ReactEditText.onLayout()
     * never runs and ReactContentSizeWatcher never dispatches a smaller size. The field could then
     * only ever grow. See TryQuiet/quiet#2655.
     *
     * A single-line field pins nothing here either - it takes the wrapper's INPUT_HEIGHT.
     */
    ${multiline ? `min-height: 40px;` : ''}
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

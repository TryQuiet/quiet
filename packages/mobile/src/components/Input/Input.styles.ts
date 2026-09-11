import { Platform, Pressable, TextInput } from 'react-native'
import styled, { css } from 'styled-components/native'
import { defaultTheme } from '../../styles/themes/default.theme'

export const StyledTextInput = styled(TextInput)<{
  height: number
  multiline?: boolean
}>`
  ${({ height, multiline }) => css`
    text-align-vertical: center;
    /*
     * A multiline input must keep an auto height. Its own box is what React Native measures to
     * produce onContentSizeChange, so pinning that box to the last reported height freezes the
     * measurement: on Android a definite height stops Yoga consulting
     * ReactTextInputShadowNode.measure(), the view is never re-laid-out, ReactEditText.onLayout()
     * never runs and ReactContentSizeWatcher never dispatches a smaller size. The field could then
     * only ever grow. See TryQuiet/quiet#2655.
     */
    ${multiline
      ? css`
          min-height: 40px;
        `
      : css`
          height: ${Math.max(40, height)}px;
        `}
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
  round: boolean
}>`
  ${({ disabled, round }) => css`
    background-color: ${disabled
      ? defaultTheme.palette.input.backgroundDisabled
      : defaultTheme.palette.input.backgroundDefault};
    border-color: ${defaultTheme.palette.input.border};
    border-radius: ${round ? '16px' : '4px'};
    border-width: 1px;
    padding-left: 16px;
    padding-right: 16px;
    height: 56px;
    justify-content: center;
    flex-grow: 1;
  `}
`

import React from 'react'
import { StyleSheet, ViewStyle } from 'react-native'
import { fireEvent, screen } from '@testing-library/react-native'
import type { ReactTestInstance } from 'react-test-renderer'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Input } from './Input.component'
import { INPUT_HEIGHT } from './Input.styles'

describe('MessageInput component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(<Input onChangeText={() => {}} placeholder={'Message #general as @holmes'} />)

    expect(toJSON()).toMatchInlineSnapshot(`
      <View>
        <View>
          <View
            accessibilityState={
              {
                "busy": undefined,
                "checked": undefined,
                "disabled": false,
                "expanded": undefined,
                "selected": undefined,
              }
            }
            accessibilityValue={
              {
                "max": undefined,
                "min": undefined,
                "now": undefined,
                "text": undefined,
              }
            }
            accessible={true}
            collapsable={false}
            focusable={true}
            focused={false}
            invalid={false}
            onBlur={[Function]}
            onClick={[Function]}
            onFocus={[Function]}
            onResponderGrant={[Function]}
            onResponderMove={[Function]}
            onResponderRelease={[Function]}
            onResponderTerminate={[Function]}
            onResponderTerminationRequest={[Function]}
            onStartShouldSetResponder={[Function]}
            style={
              [
                {
                  "alignItems": "center",
                  "backgroundColor": "#ffffff",
                  "borderBottomLeftRadius": 16,
                  "borderBottomRightRadius": 16,
                  "borderColor": "#B3B3B3",
                  "borderTopLeftRadius": 16,
                  "borderTopRightRadius": 16,
                  "borderWidth": 1,
                  "flexDirection": "row",
                  "flexGrow": 1,
                  "height": 48,
                  "justifyContent": "flex-start",
                  "paddingLeft": 16,
                  "paddingRight": 16,
                },
                {
                  "height": 48,
                },
              ]
            }
          >
            <TextInput
              autoCorrect={true}
              editable={true}
              height={54}
              keyboardType="default"
              onBlur={[Function]}
              onChangeText={[Function]}
              onContentSizeChange={[Function]}
              onFocus={[Function]}
              placeholder="Message #general as @holmes"
              placeholderTextColor="#7F7F7F"
              style={
                {
                  "flexBasis": 0,
                  "flexGrow": 1,
                  "flexShrink": 1,
                  "paddingBottom": 12,
                  "paddingTop": 12,
                  "textAlignVertical": "center",
                }
              }
              testID="input"
            />
          </View>
        </View>
      </View>
    `)
  })
})

/**
 * Regression coverage for TryQuiet/quiet#2655 — "Message entry field doesn't scale back down".
 *
 * A multiline TextInput may not pin its own `height`, because the height it reports through
 * `onContentSizeChange` is produced by the very box we would be pinning:
 *
 *  - Android: a definite height on the Yoga node means `ReactTextInputShadowNode.measure()`
 *    (react-native/ReactAndroid/.../textinput/ReactTextInputShadowNode.java) is never consulted,
 *    so the view keeps the frame JS wrote and is never re-laid-out. `ReactEditText.onLayout()`
 *    (ReactEditText.java:252) is what drives `ReactContentSizeWatcher.onLayout()`
 *    (ReactTextInputManager.java:1191), and that watcher only dispatches when the measured size
 *    differs from the size it last dispatched (ReactTextInputManager.java:1227). Pin the height
 *    and no smaller size is ever reported, so the field ratchets up and never comes back down.
 *  - iOS measures the text in the shadow view with an unbounded height
 *    (RCTBaseTextInputShadowView.mm:84-111), which is why the report is Android-only.
 *
 * Jest has no native layout, so `nativeReportsContentHeight` below models that Android rule:
 * a smaller content size is only delivered while the input's own height is free.
 */
describe('multiline Input auto-sizing (#2655)', () => {
  const BASE_WRAPPER_HEIGHT = 54

  const inputStyle = (): ViewStyle => StyleSheet.flatten(screen.getByTestId('input').props.style) ?? {}

  // The pressable wrapper carries no testID, so walk up to the nearest host element.
  const wrapperHeight = (): number | undefined => {
    let node: ReactTestInstance | null = screen.getByTestId('input').parent
    while (node && typeof node.type !== 'string') {
      node = node.parent
    }
    return (StyleSheet.flatten(node?.props.style) as ViewStyle | undefined)?.height as number | undefined
  }

  const nativeReportsContentHeight = (height: number) => {
    const pinned = inputStyle().height
    if (typeof pinned === 'number' && height < pinned) {
      // The native view cannot shrink below the height we pinned, so no event is dispatched.
      return
    }
    fireEvent(screen.getByTestId('input'), 'contentSizeChange', {
      nativeEvent: { contentSize: { height, width: 300 } },
    })
  }

  it('leaves the multiline input free to re-measure itself', () => {
    renderComponent(<Input multiline onChangeText={() => {}} placeholder={'Message #general'} />)

    nativeReportsContentHeight(200)

    expect(inputStyle().height).toBeUndefined()
    expect(inputStyle().minHeight).toBe(40)
  })

  it('scales the wrapper back down once the message is sent', () => {
    renderComponent(<Input multiline onChangeText={() => {}} placeholder={'Message #general'} />)

    // A long message grows the field.
    nativeReportsContentHeight(200)
    expect(wrapperHeight()).toBe(220)

    // The chat screen clears the input after send and the field reflows to one line.
    nativeReportsContentHeight(24)
    expect(wrapperHeight()).toBe(BASE_WRAPPER_HEIGHT)
  })

  // Control: this fix is about the multiline branch only. Single-line fields take their height
  // from the wrapper (INPUT_HEIGHT, "Input 2.0 base") and pin nothing on the field itself, so
  // neither the height they had before nor the min-height added above may appear here.
  it('leaves single-line inputs sized by their wrapper', () => {
    renderComponent(<Input onChangeText={() => {}} placeholder={'Username'} />)

    expect(inputStyle().height).toBeUndefined()
    expect(inputStyle().minHeight).toBeUndefined()
    expect(wrapperHeight()).toBe(INPUT_HEIGHT)
  })
})

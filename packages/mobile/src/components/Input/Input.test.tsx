import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Input } from './Input.component'

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
                  "borderColor": "#B3B3B3",
                  "borderRadius": 16,
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
                [
                  {
                    "flexBasis": 0,
                    "flexGrow": 1,
                    "flexShrink": 1,
                    "paddingBottom": 12,
                    "paddingTop": 12,
                    "textAlignVertical": "center",
                  },
                ]
              }
              testID="input"
            />
          </View>
        </View>
      </View>
    `)
  })
})

import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Input } from './Input.component'

describe('MessageInput component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(<Input onChangeText={() => {}} placeholder={'Message #general as @holmes'} />)

    expect(toJSON()).toMatchInlineSnapshot(`
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
          onBlur={[Function]}
          onClick={[Function]}
          onFocus={[Function]}
          onResponderGrant={[Function]}
          onResponderMove={[Function]}
          onResponderRelease={[Function]}
          onResponderTerminate={[Function]}
          onResponderTerminationRequest={[Function]}
          onStartShouldSetResponder={[Function]}
          round={false}
          style={
            [
              {
                "backgroundColor": "#ffffff",
                "borderColor": "#C4C4C4",
                "borderRadius": 4,
                "borderWidth": 1,
                "flexGrow": 1,
                "height": 56,
                "justifyContent": "center",
                "paddingLeft": 16,
                "paddingRight": 16,
              },
            ]
          }
        >
          <TextInput
            editable={true}
            onChangeText={[Function]}
            placeholder="Message #general as @holmes"
            style={
              [
                {
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
    `)
  })
})

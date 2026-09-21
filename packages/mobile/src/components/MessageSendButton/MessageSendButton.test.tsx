import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { MessageSendButton } from './MessageSendButton.component'

describe('MessageSendButton component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(<MessageSendButton onPress={jest.fn()} disabled={false} />)

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        accessibilityState={
          {
            "busy": undefined,
            "checked": undefined,
            "disabled": undefined,
            "expanded": undefined,
            "selected": undefined,
          }
        }
        accessible={true}
        focusable={true}
        hitSlop={
          {
            "bottom": 8,
            "left": 8,
            "right": 8,
            "top": 8,
          }
        }
        onClick={[Function]}
        onResponderGrant={[Function]}
        onResponderMove={[Function]}
        onResponderRelease={[Function]}
        onResponderTerminate={[Function]}
        onResponderTerminationRequest={[Function]}
        onStartShouldSetResponder={[Function]}
        style={
          {
            "alignItems": "center",
            "justifyContent": "center",
            "minHeight": 44,
            "paddingLeft": 20,
            "paddingRight": 20,
          }
        }
        testID="send_message_button"
      >
        <Image
          resizeMethod="resize"
          resizeMode="cover"
          source={
            {
              "testUri": "../../../src/assets/icons/png/icon_send.png",
            }
          }
          style={
            {
              "alignSelf": "center",
              "height": 20,
              "width": 20,
            }
          }
        />
      </View>
    `)
  })
})

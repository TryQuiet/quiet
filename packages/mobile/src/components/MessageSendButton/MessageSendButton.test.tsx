import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { MessageSendButton } from './MessageSendButton.component'

describe('MessageSendButton component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(<MessageSendButton onPress={jest.fn()} disabled={false} />)

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        accessible={true}
        focusable={true}
        onClick={[Function]}
        onResponderGrant={[Function]}
        onResponderMove={[Function]}
        onResponderRelease={[Function]}
        onResponderTerminate={[Function]}
        onResponderTerminationRequest={[Function]}
        onStartShouldSetResponder={[Function]}
        style={
          Object {
            "flex": 1.5,
            "justifyContent": "center",
          }
        }
      >
        <Image
          resizeMethod="resize"
          resizeMode="cover"
          source={
            Object {
              "testUri": "../../../assets/icons/icon_send.png",
            }
          }
          style={
            Object {
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

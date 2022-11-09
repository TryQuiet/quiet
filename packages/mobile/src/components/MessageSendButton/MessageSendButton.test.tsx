import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { MessageSendButton } from './MessageSendButton.component'

describe('MessageSendButton component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(<MessageSendButton onPress={jest.fn()} disabled={false} />)

    expect(toJSON()).toMatchInlineSnapshot(`
      <Image
        accessible={true}
        focusable={true}
        onClick={[Function]}
        onResponderGrant={[Function]}
        onResponderMove={[Function]}
        onResponderRelease={[Function]}
        onResponderTerminate={[Function]}
        onResponderTerminationRequest={[Function]}
        onStartShouldSetResponder={[Function]}
        resizeMethod="resize"
        resizeMode="cover"
        source={
          Object {
            "testUri": "../../../assets/icons/icon_send.png",
          }
        }
        style={
          Object {
            "alignSelf": "flex-end",
            "height": 20,
            "width": 20,
          }
        }
      />
    `)
  })
})

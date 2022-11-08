import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { MessageSendButton } from './MessageSendButton.component'

describe('MessageSendButton component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(<MessageSendButton onPress={jest.fn()} disabled={false} />)

    expect(toJSON()).toMatchInlineSnapshot(`
      <RNGestureHandlerButton
        collapsable={false}
        onGestureEvent={[Function]}
        onGestureHandlerEvent={[Function]}
        onGestureHandlerStateChange={[Function]}
        onHandlerStateChange={[Function]}
        rippleColor={0}
      >
        <View
          accessible={true}
          collapsable={false}
          style={
            Object {
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
                "alignSelf": "flex-end",
                "height": 20,
                "width": 20,
              }
            }
          />
        </View>
      </RNGestureHandlerButton>
    `)
  })
})

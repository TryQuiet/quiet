import React from 'react';

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent';
import { MessageSendButton } from './MessageSendButton.component';

describe('MessageSendButton component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <MessageSendButton onPress={jest.fn()} disabled={false} />,
    );

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
          style={
            Object {
              "height": 56,
              "justifyContent": "center",
              "width": 56,
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
                "height": 30,
                "marginBottom": 5,
                "width": 30,
              }
            }
          />
        </View>
      </RNGestureHandlerButton>
    `);
  });
});

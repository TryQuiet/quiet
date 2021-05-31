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
          style={Object {}}
        >
          <Image
            source={
              Object {
                "testUri": "../../../assets/icons/icon_send.png",
              }
            }
            style={
              Object {
                "height": 24,
                "resizeMode": "cover",
                "width": 24,
              }
            }
          />
        </View>
      </RNGestureHandlerButton>
    `);
  });
});

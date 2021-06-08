import React from 'react';

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent';
import { Button } from './Button.component';

describe('Button component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(<Button />);

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
          <Text
            style={
              Array [
                Object {
                  "backgroundColor": "#521C74",
                  "borderRadius": 5,
                  "color": "#ffffff",
                  "fontFamily": "Rubik-Regular",
                  "paddingBottom": 10,
                  "paddingLeft": 0,
                  "paddingRight": 0,
                  "paddingTop": 10,
                  "textAlign": "center",
                },
              ]
            }
          />
        </View>
      </RNGestureHandlerButton>
    `);
  });
});

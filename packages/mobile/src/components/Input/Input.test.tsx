import React from 'react';

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent';
import { Input } from './Input.component';

describe('MessageInput component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <Input
        onChangeText={() => {}}
        placeholder={'Message #general as @holmes'}
      />,
    );

    expect(toJSON()).toMatchInlineSnapshot(`
      <View>
        <View
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
          style={
            Array [
              Object {
                "backgroundColor": "#ffffff",
                "borderColor": "#B3B3B3",
                "borderRadius": 4,
                "borderWidth": 1,
                "flexGrow": 1,
                "maxHeight": 72,
                "minHeight": 42,
                "paddingLeft": 15,
                "paddingRight": 15,
              },
            ]
          }
        >
          <TextInput
            allowFontScaling={true}
            editable={true}
            onChangeText={[Function]}
            placeholder="Message #general as @holmes"
            rejectResponderTermination={true}
            style={
              Array [
                Object {
                  "paddingBottom": 8,
                  "paddingTop": 8,
                  "textAlignVertical": "center",
                },
              ]
            }
            underlineColorAndroid="transparent"
          />
        </View>
      </View>
    `);
  });
});

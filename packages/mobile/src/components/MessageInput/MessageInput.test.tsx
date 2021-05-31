import React from 'react';

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent';
import { MessageInput } from './MessageInput.component';

describe('MessageInput component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <MessageInput
        onChangeText={() => {}}
        placeholder={'Message #general as @holmes'}
      />,
    );

    expect(toJSON()).toMatchInlineSnapshot(`
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
          multiline={true}
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
    `);
  });
});

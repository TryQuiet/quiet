import React from 'react';

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent';
import { Registration } from './Registration.component';

describe('Registration component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(<Registration />);

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        onLayout={[Function]}
        style={
          Object {
            "flex": 1,
            "justifyContent": "center",
            "paddingLeft": 20,
            "paddingRight": 20,
          }
        }
      >
        <Text
          color="main"
          fontSize={24}
          fontWeight="medium"
          horizontalTextAlign="left"
          style={
            Array [
              Object {
                "color": "#000000",
                "fontFamily": "Rubik-Medium",
                "fontSize": 24,
                "textAlign": "left",
                "textAlignVertical": "center",
              },
              Object {
                "marginBottom": 30,
              },
            ]
          }
          verticalTextAlign="center"
        >
          Register a username
        </Text>
        <View>
          <Text
            color="main"
            fontSize={10}
            horizontalTextAlign="left"
            style={
              Array [
                Object {
                  "color": "#000000",
                  "fontFamily": "Rubik-Regular",
                  "fontSize": 10,
                  "textAlign": "left",
                  "textAlignVertical": "center",
                },
                Object {
                  "paddingBottom": 10,
                },
              ]
            }
            verticalTextAlign="center"
          >
            Choose your favorite username
          </Text>
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
              placeholder="Enter a username"
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
          <Text
            color="hint"
            fontSize={10}
            horizontalTextAlign="left"
            style={
              Array [
                Object {
                  "color": "#999999",
                  "fontFamily": "Rubik-Regular",
                  "fontSize": 10,
                  "textAlign": "left",
                  "textAlignVertical": "center",
                },
                Object {
                  "paddingTop": 10,
                },
              ]
            }
            verticalTextAlign="center"
          >
            Your username cannot have any spaces or special characters, must be lowercase letters and numbers only.
          </Text>
        </View>
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
                  Object {
                    "marginTop": 30,
                  },
                ]
              }
            >
              Continue
            </Text>
          </View>
        </RNGestureHandlerButton>
      </View>
    `);
  });
});

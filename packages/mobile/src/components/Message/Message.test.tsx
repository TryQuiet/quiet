import React from 'react';

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent';
import { Message } from './Message.component';

describe('Message component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <Message
        message={{
          id: 'id',
          message:
            'Brownie powder marshmallow dessert carrot cake marzipan cake caramels. Muffin topping wafer jelly apple pie candy. Fruitcake chocolate pudding fruitcake candy lemon drops chocolate.',
          nickname: 'holmes',
          datetime: '1:30pm',
        }}
      />,
    );

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        onLayout={[Function]}
        style={
          Array [
            Object {
              "flex": 1,
            },
            Object {
              "paddingBottom": 0,
            },
          ]
        }
      >
        <View
          style={
            Object {
              "flexDirection": "row",
              "paddingBottom": 20,
            }
          }
        >
          <View
            style={
              Object {
                "alignItems": "center",
                "flex": 1,
                "paddingRight": 12,
                "paddingTop": 5,
              }
            }
          >
            <Image
              source={
                Object {
                  "testUri": "../../../assets/icons/avatar.png",
                }
              }
              style={
                Object {
                  "borderRadius": 5,
                  "height": 32,
                  "resizeMode": "cover",
                  "width": 32,
                }
              }
            />
          </View>
          <View
            style={
              Object {
                "flex": 10,
              }
            }
          >
            <View
              style={
                Object {
                  "flexDirection": "row",
                  "paddingBottom": 3,
                }
              }
            >
              <View
                style={
                  Object {
                    "alignSelf": "flex-start",
                  }
                }
              >
                <Text
                  color="main"
                  fontSize={16}
                  fontWeight="medium"
                  horizontalTextAlign="left"
                  style={
                    Array [
                      Object {
                        "color": "#000000",
                        "fontFamily": "Rubik-Medium",
                        "fontSize": 16,
                        "textAlign": "left",
                        "textAlignVertical": "center",
                      },
                    ]
                  }
                  verticalTextAlign="center"
                >
                  holmes
                </Text>
              </View>
              <View
                style={
                  Object {
                    "alignSelf": "flex-start",
                    "paddingLeft": 8,
                    "paddingTop": 2,
                  }
                }
              >
                <Text
                  color="subtitle"
                  fontSize={14}
                  horizontalTextAlign="left"
                  style={
                    Array [
                      Object {
                        "color": "#999999",
                        "fontFamily": "Rubik-Regular",
                        "fontSize": 14,
                        "textAlign": "left",
                        "textAlignVertical": "center",
                      },
                    ]
                  }
                  verticalTextAlign="center"
                >
                  1:30pm
                </Text>
              </View>
            </View>
            <View
              style={
                Object {
                  "flexShrink": 1,
                }
              }
            >
              <Text
                color="main"
                fontSize={14}
                horizontalTextAlign="left"
                style={
                  Array [
                    Object {
                      "color": "#000000",
                      "fontFamily": "Rubik-Regular",
                      "fontSize": 14,
                      "textAlign": "left",
                      "textAlignVertical": "center",
                    },
                  ]
                }
                verticalTextAlign="center"
              >
                Brownie powder marshmallow dessert carrot cake marzipan cake caramels. Muffin topping wafer jelly apple pie candy. Fruitcake chocolate pudding fruitcake candy lemon drops chocolate.
              </Text>
            </View>
          </View>
        </View>
      </View>
    `);
  });
});

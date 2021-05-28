import React from 'react';

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent';
import { Message } from './Message.component';

describe('Message component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <Message
        nickname={'holmes'}
        datetime={'1.55pm'}
        message={{
          id: '',
          type: 0,
          typeIndicator: 0,
          message:
            'Message text. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt.',
          createdAt: 0,
          r: 0,
          channelId: '',
          signature: '',
        }}
      />,
    );

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          Object {
            "flexDirection": "row",
            "paddingBottom": 20,
            "paddingLeft": 20,
            "paddingRight": 20,
          }
        }
      >
        <View
          style={
            Object {
              "alignItems": "center",
              "flex": 1,
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
              "flex": 5,
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
                1.55pm
              </Text>
            </View>
          </View>
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
            Message text. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt.
          </Text>
        </View>
      </View>
    `);
  });
});

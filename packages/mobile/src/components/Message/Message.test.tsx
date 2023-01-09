import { MessageType } from '@quiet/state-manager'
import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Message } from './Message.component'

describe('Message component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <Message
        data={[
          {
            id: 'id',
            type: MessageType.Basic,
            message:
              'Brownie powder marshmallow dessert carrot cake marzipan cake caramels. Muffin topping wafer jelly apple pie candy. Fruitcake chocolate pudding fruitcake candy lemon drops chocolate.',
            createdAt: 0,
            date: '1:30pm',
            nickname: 'holmes'
          }
        ]}
        pendingMessages={{}}
      />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          Object {
            "flex": 1,
          }
        }
      >
        <View
          style={
            Object {
              "flexDirection": "row",
              "paddingBottom": 30,
            }
          }
        >
          <View
            style={
              Object {
                "alignItems": "center",
                "flex": 1,
                "paddingRight": 15,
              }
            }
          >
            <View
              style={
                Object {
                  "width": 37,
                }
              }
            >
              <RNSVGSvgView
                align="xMidYMid"
                bbHeight={37}
                bbWidth={37}
                focusable={false}
                height={37}
                meetOrSlice={0}
                minX={0}
                minY={0}
                style={
                  Array [
                    Object {
                      "backgroundColor": "transparent",
                      "borderWidth": 0,
                    },
                    Object {
                      "flex": 0,
                      "height": 37,
                      "width": 37,
                    },
                  ]
                }
                vbHeight={37}
                vbWidth={37}
                width={37}
                xml="<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"37\\" height=\\"37\\" viewBox=\\"0 0 37 37\\"><path fill=\\"#4c4c4c\\" d=\\"M12.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M19.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M19.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M12.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 14.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 14.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 21.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 21.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0\\"/><path fill=\\"#e5e5e5\\" d=\\"M5.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0\\"/><path fill=\\"#ccc566\\" d=\\"M11 11L18 11L18 18L11 18ZM15.6 17.3L17.3 13.8L13.8 13.8ZM25 11L25 18L18 18L18 11ZM18.7 15.6L22.2 17.3L22.2 13.8ZM25 25L18 25L18 18L25 18ZM20.5 18.7L18.7 22.2L22.2 22.2ZM11 25L11 18L18 18L18 25ZM17.3 20.5L13.8 18.7L13.8 22.2Z\\"/></svg>"
                xmlns="http://www.w3.org/2000/svg"
              >
                <RNSVGGroup>
                  <RNSVGPath
                    d="M12.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M19.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M19.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M12.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 14.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 14.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 21.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 21.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0"
                    fill={4283190348}
                    propList={
                      Array [
                        "fill",
                      ]
                    }
                  />
                  <RNSVGPath
                    d="M5.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0"
                    fill={4293256677}
                    propList={
                      Array [
                        "fill",
                      ]
                    }
                  />
                  <RNSVGPath
                    d="M11 11L18 11L18 18L11 18ZM15.6 17.3L17.3 13.8L13.8 13.8ZM25 11L25 18L18 18L18 11ZM18.7 15.6L22.2 17.3L22.2 13.8ZM25 25L18 25L18 18L25 18ZM20.5 18.7L18.7 22.2L22.2 22.2ZM11 25L11 18L18 18L18 25ZM17.3 20.5L13.8 18.7L13.8 22.2Z"
                    fill={4291609958}
                    propList={
                      Array [
                        "fill",
                      ]
                    }
                  />
                </RNSVGGroup>
              </RNSVGSvgView>
            </View>
          </View>
          <View
            style={
              Object {
                "flex": 8,
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
              <View
                style={
                  Object {
                    "paddingTop": 0,
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
      </View>
    `)
  })
})

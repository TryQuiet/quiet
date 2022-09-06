import { MessageType } from '@quiet/state-manager'
import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Message } from './Message.component'

jest.mock('react-native-jdenticon', () => {
  const mockJdenticon = () => {
    return null
  }
  return mockJdenticon
})

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
          />
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

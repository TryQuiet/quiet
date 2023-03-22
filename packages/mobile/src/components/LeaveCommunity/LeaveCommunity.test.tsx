import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { LeaveCommunity } from './LeaveCommunity.component'

describe('LeaveCommunity component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <LeaveCommunity name={'Rockets'} leaveCommunity={jest.fn()} handleBackButton={jest.fn()} />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          Object {
            "backgroundColor": "#ffffff",
            "flex": 1,
          }
        }
      >
        <View
          style={
            Array [
              Object {
                "backgroundColor": "#ffffff",
                "borderBottomColor": "#F0F0F0",
                "borderBottomWidth": 1,
                "flexDirection": "row",
                "flexGrow": 1,
                "maxHeight": 52,
                "minHeight": 52,
              },
            ]
          }
        >
          <View
            accessible={true}
            focusable={true}
            onClick={[Function]}
            onResponderGrant={[Function]}
            onResponderMove={[Function]}
            onResponderRelease={[Function]}
            onResponderTerminate={[Function]}
            onResponderTerminationRequest={[Function]}
            onStartShouldSetResponder={[Function]}
            style={
              Object {
                "alignItems": "center",
                "justifyContent": "center",
                "width": 64,
              }
            }
          >
            <Image
              resizeMethod="resize"
              resizeMode="cover"
              source={
                Object {
                  "testUri": "../../../assets/icons/arrow_left.png",
                }
              }
              style={
                Object {
                  "height": 16,
                  "width": 16,
                }
              }
            />
          </View>
          <View
            style={
              Object {
                "alignItems": "center",
                "flexGrow": 1,
                "justifyContent": "center",
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
              Leave community
            </Text>
          </View>
          <View
            style={
              Object {
                "width": 64,
              }
            }
          />
        </View>
        <View
          style={
            Object {
              "padding": 24,
            }
          }
        >
          <View>
            <Text
              color="main"
              fontSize={18}
              fontWeight="medium"
              horizontalTextAlign="left"
              style={
                Array [
                  Object {
                    "color": "#000000",
                    "fontFamily": "Rubik-Medium",
                    "fontSize": 18,
                    "textAlign": "left",
                    "textAlignVertical": "center",
                  },
                ]
              }
              verticalTextAlign="center"
            >
              Are you sure you want to leave?
            </Text>
          </View>
          <View
            style={
              Object {
                "paddingTop": 16,
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
              Your account, messages, and all data for
               
              <Text
                color="main"
                fontSize={14}
                fontWeight="medium"
                horizontalTextAlign="left"
                style={
                  Array [
                    Object {
                      "color": "#000000",
                      "fontFamily": "Rubik-Medium",
                      "fontSize": 14,
                      "textAlign": "left",
                      "textAlignVertical": "center",
                    },
                  ]
                }
                verticalTextAlign="center"
              >
                Rockets
              </Text>
               
              will be deleted from this device. This cannot be undone.
            </Text>
          </View>
          <View
            style={
              Object {
                "paddingTop": 16,
              }
            }
          >
            <View
              accessible={true}
              focusable={true}
              onClick={[Function]}
              onResponderGrant={[Function]}
              onResponderMove={[Function]}
              onResponderRelease={[Function]}
              onResponderTerminate={[Function]}
              onResponderTerminationRequest={[Function]}
              onStartShouldSetResponder={[Function]}
              style={
                Object {
                  "alignItems": "center",
                  "backgroundColor": "#521C74",
                  "borderRadius": 5,
                  "justifyContent": "center",
                  "marginVertical": 12,
                  "minHeight": 45,
                  "paddingVertical": 12,
                }
              }
            >
              <Text
                color="white"
                fontSize={14}
                horizontalTextAlign="left"
                style={
                  Array [
                    Object {
                      "color": "#ffffff",
                      "fontFamily": "Rubik-Regular",
                      "fontSize": 14,
                      "textAlign": "left",
                      "textAlignVertical": "center",
                    },
                  ]
                }
                verticalTextAlign="center"
              >
                Leave community
              </Text>
            </View>
          </View>
          <View>
            <View
              accessible={true}
              focusable={true}
              onClick={[Function]}
              onResponderGrant={[Function]}
              onResponderMove={[Function]}
              onResponderRelease={[Function]}
              onResponderTerminate={[Function]}
              onResponderTerminationRequest={[Function]}
              onStartShouldSetResponder={[Function]}
              style={
                Object {
                  "alignItems": "center",
                  "backgroundColor": "transparent",
                  "borderRadius": 5,
                  "justifyContent": "center",
                  "marginVertical": 0,
                  "minHeight": 45,
                  "paddingVertical": 12,
                }
              }
            >
              <Text
                color="gray50"
                fontSize={14}
                horizontalTextAlign="left"
                style={
                  Array [
                    Object {
                      "color": "#7F7F7F",
                      "fontFamily": "Rubik-Regular",
                      "fontSize": 14,
                      "textAlign": "left",
                      "textAlignVertical": "center",
                    },
                  ]
                }
                verticalTextAlign="center"
              >
                Never mind, I'll stay
              </Text>
            </View>
          </View>
        </View>
      </View>
    `)
  })
})

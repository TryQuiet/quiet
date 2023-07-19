import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { DeleteChannel } from './DeleteChannel.component'

describe('DeleteChannel component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <DeleteChannel name={'general'} deleteChannel={jest.fn()} handleBackButton={jest.fn()} />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          {
            "backgroundColor": "#ffffff",
            "flex": 1,
          }
        }
        testID="delete-channel-component"
      >
        <View
          style={
            [
              {
                "alignItems": "center",
                "backgroundColor": "#ffffff",
                "borderBottomColor": "#F0F0F0",
                "borderBottomWidth": 1,
                "display": "flex",
                "flexDirection": "row",
                "justifyContent": "center",
                "maxHeight": 52,
                "minHeight": 52,
              },
            ]
          }
        >
          <View
            style={
              {
                "flex": 1,
              }
            }
          >
            <View
              accessibilityState={
                {
                  "busy": undefined,
                  "checked": undefined,
                  "disabled": undefined,
                  "expanded": undefined,
                  "selected": undefined,
                }
              }
              accessibilityValue={
                {
                  "max": undefined,
                  "min": undefined,
                  "now": undefined,
                  "text": undefined,
                }
              }
              accessible={true}
              collapsable={false}
              focusable={true}
              onClick={[Function]}
              onResponderGrant={[Function]}
              onResponderMove={[Function]}
              onResponderRelease={[Function]}
              onResponderTerminate={[Function]}
              onResponderTerminationRequest={[Function]}
              onStartShouldSetResponder={[Function]}
              style={
                {
                  "opacity": 1,
                }
              }
              testID="appbar_action_item"
            >
              <View
                style={
                  {
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
                    {
                      "testUri": "../../../assets/icons/arrow_left.png",
                    }
                  }
                  style={
                    {
                      "height": 16,
                      "width": 16,
                    }
                  }
                />
              </View>
            </View>
          </View>
          <View
            style={
              {
                "alignItems": "center",
                "flex": 4,
              }
            }
          >
            <Text
              color="main"
              fontSize={16}
              fontWeight="medium"
              horizontalTextAlign="left"
              style={
                [
                  {
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
              Delete channel
            </Text>
          </View>
          <View
            style={
              {
                "flex": 1,
              }
            }
          />
        </View>
        <View
          style={
            {
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
                [
                  {
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
              Are you sure?
            </Text>
          </View>
          <View
            style={
              {
                "paddingTop": 16,
              }
            }
          >
            <Text
              color="main"
              fontSize={14}
              horizontalTextAlign="left"
              style={
                [
                  {
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
              Channel
               
              <Text
                color="main"
                fontSize={14}
                fontWeight="medium"
                horizontalTextAlign="left"
                style={
                  [
                    {
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
                #
                general
              </Text>
               
              will be removed from the community. This cannot be undone.
            </Text>
          </View>
          <View
            style={
              {
                "paddingTop": 16,
              }
            }
          >
            <View
              accessibilityState={
                {
                  "busy": undefined,
                  "checked": undefined,
                  "disabled": undefined,
                  "expanded": undefined,
                  "selected": undefined,
                }
              }
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
                {
                  "alignItems": "center",
                  "backgroundColor": "#521C74",
                  "borderRadius": 5,
                  "justifyContent": "center",
                  "marginVertical": 12,
                  "minHeight": 45,
                  "paddingVertical": 12,
                  "width": undefined,
                }
              }
              testID="button"
            >
              <Text
                color="white"
                fontSize={14}
                horizontalTextAlign="left"
                style={
                  [
                    {
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
                Delete channel
              </Text>
            </View>
          </View>
          <View>
            <View
              accessibilityState={
                {
                  "busy": undefined,
                  "checked": undefined,
                  "disabled": undefined,
                  "expanded": undefined,
                  "selected": undefined,
                }
              }
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
                {
                  "alignItems": "center",
                  "backgroundColor": "transparent",
                  "borderRadius": 5,
                  "justifyContent": "center",
                  "marginVertical": 0,
                  "minHeight": 45,
                  "paddingVertical": 12,
                  "width": undefined,
                }
              }
              testID="button"
            >
              <Text
                color="gray50"
                fontSize={14}
                horizontalTextAlign="left"
                style={
                  [
                    {
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
                Never mind
              </Text>
            </View>
          </View>
        </View>
      </View>
    `)
  })
})

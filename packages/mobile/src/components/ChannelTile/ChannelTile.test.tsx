import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { ChannelTile } from './ChannelTile.component'

describe('ChannelList component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <ChannelTile
        name={'general'}
        address={'general'}
        message={
          'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.'
        }
        date={'1:55pm'}
        unread={false}
        redirect={jest.fn()}
      />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
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
            "borderBottomColor": "#F0F0F0",
            "borderBottomWidth": 1,
            "padding": 16,
          }
        }
        testID="channel_tile_general"
      >
        <View
          style={
            {
              "flexDirection": "row",
            }
          }
        >
          <View
            style={
              {
                "alignItems": "center",
                "flex": 1,
                "paddingRight": 12,
              }
            }
          >
            <View
              style={
                {
                  "alignItems": "center",
                  "backgroundColor": "#4C4C4C",
                  "borderRadius": 4,
                  "height": 36,
                  "justifyContent": "center",
                  "width": 36,
                }
              }
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
                ge
              </Text>
            </View>
          </View>
          <View
            style={
              {
                "flex": 9,
                "flexDirection": "column",
              }
            }
          >
            <View
              style={
                {
                  "flexDirection": "row",
                }
              }
            >
              <View
                style={
                  {
                    "flex": 8,
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
                  #
                  general
                </Text>
              </View>
              <View
                style={
                  {
                    "alignItems": "flex-end",
                    "flex": 4,
                  }
                }
              >
                <Text
                  color="subtitle"
                  fontSize={14}
                  horizontalTextAlign="left"
                  style={
                    [
                      {
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
                  1:55pm
                </Text>
              </View>
            </View>
            <View
              style={
                {
                  "flexDirection": "row",
                  "paddingTop": 3,
                }
              }
            >
              <View
                style={
                  {
                    "flex": 10,
                  }
                }
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
                  Text from latest chat message. Lorem ipsum dolor sit amet, consectetur...
                </Text>
              </View>
              <View
                style={
                  {
                    "alignItems": "flex-end",
                    "flex": 2,
                  }
                }
              />
            </View>
          </View>
        </View>
      </View>
    `)
  })

  it('should match inline snapshot (unread)', () => {
    const { toJSON } = renderComponent(
      <ChannelTile
        name={'general'}
        address={'general'}
        message={
          'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.'
        }
        date={'1:55pm'}
        unread={true}
        redirect={jest.fn()}
      />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
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
            "borderBottomColor": "#F0F0F0",
            "borderBottomWidth": 1,
            "padding": 16,
          }
        }
        testID="channel_tile_general"
      >
        <View
          style={
            {
              "flexDirection": "row",
            }
          }
        >
          <View
            style={
              {
                "alignItems": "center",
                "flex": 1,
                "paddingRight": 12,
              }
            }
          >
            <View
              style={
                {
                  "alignItems": "center",
                  "backgroundColor": "#4C4C4C",
                  "borderRadius": 4,
                  "height": 36,
                  "justifyContent": "center",
                  "width": 36,
                }
              }
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
                ge
              </Text>
            </View>
          </View>
          <View
            style={
              {
                "flex": 9,
                "flexDirection": "column",
              }
            }
          >
            <View
              style={
                {
                  "flexDirection": "row",
                }
              }
            >
              <View
                style={
                  {
                    "flex": 8,
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
                  #
                  general
                </Text>
              </View>
              <View
                style={
                  {
                    "alignItems": "flex-end",
                    "flex": 4,
                  }
                }
              >
                <Text
                  color="blue"
                  fontSize={14}
                  horizontalTextAlign="left"
                  style={
                    [
                      {
                        "color": "#2373EA",
                        "fontFamily": "Rubik-Regular",
                        "fontSize": 14,
                        "textAlign": "left",
                        "textAlignVertical": "center",
                      },
                    ]
                  }
                  verticalTextAlign="center"
                >
                  1:55pm
                </Text>
              </View>
            </View>
            <View
              style={
                {
                  "flexDirection": "row",
                  "paddingTop": 3,
                }
              }
            >
              <View
                style={
                  {
                    "flex": 10,
                  }
                }
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
                  Text from latest chat message. Lorem ipsum dolor sit amet, consectetur...
                </Text>
              </View>
              <View
                style={
                  {
                    "alignItems": "flex-end",
                    "flex": 2,
                  }
                }
              >
                <View
                  style={
                    {
                      "alignItems": "center",
                      "backgroundColor": "#2373EA",
                      "borderRadius": 100,
                      "height": 20,
                      "justifyContent": "center",
                      "width": 36,
                    }
                  }
                >
                  <Text
                    color="white"
                    fontSize={12}
                    fontWeight="medium"
                    horizontalTextAlign="left"
                    style={
                      [
                        {
                          "color": "#ffffff",
                          "fontFamily": "Rubik-Medium",
                          "fontSize": 12,
                          "textAlign": "left",
                          "textAlignVertical": "center",
                        },
                      ]
                    }
                    verticalTextAlign="center"
                  >
                    new
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    `)
  })
})

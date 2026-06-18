import React from 'react'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { AppHome } from './AppHome.component'
import { ChannelType } from '@quiet/types'

describe('AppHome component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <AppHome
        // @ts-ignore
        community={{
          name: 'Quiet',
        }}
        channelTiles={[
          {
            name: 'general',
            id: 'general',
            unread: false,
            isPublic: true,
            redirect: jest.fn(),
            channelType: ChannelType.CHANNEL,
          },
          {
            name: 'spam',
            id: 'spam',
            unread: false,
            isPublic: true,
            redirect: jest.fn(),
            channelType: ChannelType.CHANNEL,
          },
          {
            name: 'design',
            id: 'design',
            unread: true,
            isPublic: true,
            redirect: jest.fn(),
            channelType: ChannelType.CHANNEL,
          },
          {
            name: 'qa',
            id: 'qa',
            unread: false,
            isPublic: true,
            redirect: jest.fn(),
            channelType: ChannelType.CHANNEL,
          },
          {
            name: 'private-chat',
            id: 'private-chat',
            unread: false,
            isPublic: false,
            redirect: jest.fn(),
            channelType: ChannelType.CHANNEL,
          },
        ]}
      />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          {
            "backgroundColor": "#461863",
            "flex": 1,
          }
        }
        testID="messages-home-component"
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
              {
                "backgroundColor": "#461863",
                "borderBottomWidth": 0,
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
                    "height": 50,
                    "justifyContent": "center",
                    "width": 64,
                  }
                }
              >
                <View
                  style={
                    {
                      "alignItems": "center",
                      "backgroundColor": "#67BFD3",
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
                    Q
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View
            style={
              {
                "alignItems": "flex-start",
                "flex": 4,
              }
            }
          >
            <Text
              color="white"
              fontSize={16}
              fontWeight="medium"
              horizontalTextAlign="left"
              style={
                [
                  {
                    "color": "#ffffff",
                    "fontFamily": "Rubik-Medium",
                    "fontSize": 16,
                    "textAlign": "left",
                    "textAlignVertical": "center",
                  },
                ]
              }
              verticalTextAlign="center"
            >
              Quiet
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
        <RCTScrollView
          style={
            {
              "backgroundColor": "#ffffff",
              "borderTopLeftRadius": 16,
              "borderTopRightRadius": 16,
              "flex": 1,
              "flexDirection": "column",
            }
          }
        >
          <View>
            <View
              style={
                {
                  "backgroundColor": "#ffffff",
                  "borderTopLeftRadius": 16,
                  "borderTopRightRadius": 16,
                  "flexDirection": "column",
                  "justifyContent": "flex-start",
                }
              }
              testID="messages-home-container"
            >
              <View
                style={
                  {
                    "alignContent": "center",
                    "alignItems": "center",
                    "backgroundColor": "#ffffff",
                    "borderTopLeftRadius": 16,
                    "borderTopRightRadius": 16,
                    "flexDirection": "row",
                    "justifyContent": "space-between",
                    "paddingBottom": 8,
                    "paddingLeft": 16,
                    "paddingTop": 16,
                  }
                }
                testID="channel-list-title"
              >
                <Text
                  color="gray70"
                  fontSize={14}
                  fontWeight="medium"
                  horizontalTextAlign="left"
                  style={
                    [
                      {
                        "color": "#4C4C4C",
                        "fontFamily": "Rubik-Medium",
                        "fontSize": 14,
                        "textAlign": "left",
                        "textAlignVertical": "center",
                      },
                    ]
                  }
                  verticalTextAlign="center"
                >
                  Channels
                </Text>
                <View
                  collapsable={false}
                  style={
                    {
                      "backgroundColor": "transparent",
                      "borderRadius": 18,
                      "height": 36,
                      "margin": 6,
                      "shadowColor": "#000",
                      "shadowOffset": {
                        "height": 0,
                        "width": 0,
                      },
                      "shadowOpacity": 0,
                      "shadowRadius": 0,
                      "width": 36,
                    }
                  }
                  testID="icon-button-container-outer-layer"
                >
                  <View
                    collapsable={false}
                    style={
                      {
                        "backgroundColor": "transparent",
                        "borderColor": "rgba(121, 116, 126, 1)",
                        "borderRadius": 18,
                        "borderWidth": 0,
                        "elevation": 0,
                        "flex": 1,
                        "overflow": "hidden",
                        "shadowColor": "#000",
                        "shadowOffset": {
                          "height": 0,
                          "width": 0,
                        },
                        "shadowOpacity": 0,
                        "shadowRadius": 0,
                      }
                    }
                    testID="icon-button-container"
                  >
                    <View
                      accessibilityComponentType="button"
                      accessibilityRole="button"
                      accessibilityState={
                        {
                          "busy": undefined,
                          "checked": undefined,
                          "disabled": true,
                          "expanded": undefined,
                          "selected": undefined,
                        }
                      }
                      accessibilityTraits="button"
                      accessibilityValue={
                        {
                          "max": undefined,
                          "min": undefined,
                          "now": undefined,
                          "text": undefined,
                        }
                      }
                      accessible={true}
                      centered={true}
                      collapsable={false}
                      focusable={true}
                      hitSlop={
                        {
                          "bottom": 6,
                          "left": 6,
                          "right": 6,
                          "top": 6,
                        }
                      }
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
                        [
                          {
                            "overflow": "hidden",
                          },
                          [
                            {
                              "alignItems": "center",
                              "flexGrow": 1,
                              "justifyContent": "center",
                            },
                            undefined,
                          ],
                        ]
                      }
                      testID="icon-button"
                    >
                      <Text
                        accessibilityElementsHidden={true}
                        importantForAccessibility="no-hide-descendants"
                        pointerEvents="none"
                        selectable={false}
                        style={
                          [
                            {
                              "backgroundColor": "transparent",
                            },
                            {
                              "color": "#4C4C4C",
                              "fontSize": 20,
                            },
                          ]
                        }
                      >
                        □
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <RCTScrollView
                data={
                  [
                    {
                      "channelType": "channel",
                      "date": "1:55pm",
                      "id": "general",
                      "isPublic": true,
                      "message": "Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.",
                      "name": "general",
                      "redirect": [MockFunction],
                      "unread": false,
                    },
                    {
                      "channelType": "channel",
                      "date": "1:55pm",
                      "id": "spam",
                      "isPublic": true,
                      "message": "Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.",
                      "name": "spam",
                      "redirect": [MockFunction],
                      "unread": false,
                    },
                    {
                      "channelType": "channel",
                      "date": "6/1/22",
                      "id": "design",
                      "isPublic": true,
                      "message": "Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.",
                      "name": "design",
                      "redirect": [MockFunction],
                      "unread": true,
                    },
                    {
                      "channelType": "channel",
                      "date": "Yesterday",
                      "id": "qa",
                      "isPublic": true,
                      "message": "Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.",
                      "name": "qa",
                      "redirect": [MockFunction],
                      "unread": false,
                    },
                    {
                      "channelType": "channel",
                      "date": "Yesterday",
                      "id": "private-chat",
                      "isPublic": false,
                      "message": "Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.",
                      "name": "private-chat",
                      "redirect": [MockFunction],
                      "unread": false,
                    },
                  ]
                }
                getItem={[Function]}
                getItemCount={[Function]}
                keyExtractor={[Function]}
                onContentSizeChange={[Function]}
                onLayout={[Function]}
                onMomentumScrollBegin={[Function]}
                onMomentumScrollEnd={[Function]}
                onScroll={[Function]}
                onScrollBeginDrag={[Function]}
                onScrollEndDrag={[Function]}
                removeClippedSubviews={false}
                renderItem={[Function]}
                scrollEventThrottle={0.0001}
                stickyHeaderIndices={[]}
                style={
                  {
                    "backgroundColor": "#ffffff",
                  }
                }
                testID="channel-list"
                viewabilityConfigCallbackPairs={[]}
              >
                <View>
                  <View
                    onFocusCapture={[Function]}
                    onLayout={[Function]}
                    style={null}
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
                        testID="channel_tile_general"
                      >
                        <View
                          style={
                            {
                              "paddingLeft": 12,
                              "paddingRight": 16,
                              "paddingVertical": 8,
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
                                  "flex": 1,
                                  "flexDirection": "row",
                                  "height": 20,
                                  "justifyContent": "space-between",
                                }
                              }
                            >
                              <View
                                style={
                                  {
                                    "alignItems": "center",
                                    "display": "flex",
                                    "flex": 1,
                                    "flexDirection": "row",
                                    "gap": 6,
                                  }
                                }
                              >
                                <RNSVGSvgView
                                  align="xMidYMid"
                                  bbHeight={18}
                                  bbWidth={18}
                                  fill="none"
                                  focusable={false}
                                  height={18}
                                  meetOrSlice={0}
                                  minX={0}
                                  minY={0}
                                  style={
                                    [
                                      {
                                        "backgroundColor": "transparent",
                                        "borderWidth": 0,
                                      },
                                      {
                                        "flex": 0,
                                        "height": 18,
                                        "width": 18,
                                      },
                                    ]
                                  }
                                  vbHeight={24}
                                  vbWidth={24}
                                  width={18}
                                >
                                  <RNSVGGroup
                                    fill={null}
                                    propList={
                                      [
                                        "fill",
                                      ]
                                    }
                                  >
                                    <RNSVGPath
                                      d="M15.7318 4.875L12.8818 19.125"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                          "strokeLinecap",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4280427042,
                                          "type": 0,
                                        }
                                      }
                                      strokeLinecap={1}
                                      strokeWidth="2"
                                    />
                                    <RNSVGPath
                                      d="M10.5355 4.875L7.68555 19.125"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                          "strokeLinecap",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4280427042,
                                          "type": 0,
                                        }
                                      }
                                      strokeLinecap={1}
                                      strokeWidth="2"
                                    />
                                    <RNSVGPath
                                      d="M6.8252 8.58594H17.7502"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                          "strokeLinecap",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4280427042,
                                          "type": 0,
                                        }
                                      }
                                      strokeLinecap={1}
                                      strokeWidth="2"
                                    />
                                    <RNSVGPath
                                      d="M5.875 15.4141H16.8"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                          "strokeLinecap",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4280427042,
                                          "type": 0,
                                        }
                                      }
                                      strokeLinecap={1}
                                      strokeWidth="2"
                                    />
                                  </RNSVGGroup>
                                </RNSVGSvgView>
                                <Text
                                  color="main"
                                  ellipsizeMode="tail"
                                  fontSize={16}
                                  fontWeight="normal"
                                  horizontalTextAlign="left"
                                  numberOfLines={1}
                                  style={
                                    [
                                      {
                                        "color": "#000000",
                                        "fontFamily": "Rubik-Regular",
                                        "fontSize": 16,
                                        "textAlign": "left",
                                        "textAlignVertical": "center",
                                      },
                                      {
                                        "color": "#222222",
                                      },
                                    ]
                                  }
                                  verticalTextAlign="center"
                                >
                                  general
                                </Text>
                              </View>
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
                                      "alignItems": "flex-end",
                                      "flex": 1,
                                    }
                                  }
                                />
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View
                    onFocusCapture={[Function]}
                    onLayout={[Function]}
                    style={null}
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
                        testID="channel_tile_spam"
                      >
                        <View
                          style={
                            {
                              "paddingLeft": 12,
                              "paddingRight": 16,
                              "paddingVertical": 8,
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
                                  "flex": 1,
                                  "flexDirection": "row",
                                  "height": 20,
                                  "justifyContent": "space-between",
                                }
                              }
                            >
                              <View
                                style={
                                  {
                                    "alignItems": "center",
                                    "display": "flex",
                                    "flex": 1,
                                    "flexDirection": "row",
                                    "gap": 6,
                                  }
                                }
                              >
                                <RNSVGSvgView
                                  align="xMidYMid"
                                  bbHeight={18}
                                  bbWidth={18}
                                  fill="none"
                                  focusable={false}
                                  height={18}
                                  meetOrSlice={0}
                                  minX={0}
                                  minY={0}
                                  style={
                                    [
                                      {
                                        "backgroundColor": "transparent",
                                        "borderWidth": 0,
                                      },
                                      {
                                        "flex": 0,
                                        "height": 18,
                                        "width": 18,
                                      },
                                    ]
                                  }
                                  vbHeight={24}
                                  vbWidth={24}
                                  width={18}
                                >
                                  <RNSVGGroup
                                    fill={null}
                                    propList={
                                      [
                                        "fill",
                                      ]
                                    }
                                  >
                                    <RNSVGPath
                                      d="M15.7318 4.875L12.8818 19.125"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                          "strokeLinecap",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4280427042,
                                          "type": 0,
                                        }
                                      }
                                      strokeLinecap={1}
                                      strokeWidth="2"
                                    />
                                    <RNSVGPath
                                      d="M10.5355 4.875L7.68555 19.125"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                          "strokeLinecap",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4280427042,
                                          "type": 0,
                                        }
                                      }
                                      strokeLinecap={1}
                                      strokeWidth="2"
                                    />
                                    <RNSVGPath
                                      d="M6.8252 8.58594H17.7502"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                          "strokeLinecap",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4280427042,
                                          "type": 0,
                                        }
                                      }
                                      strokeLinecap={1}
                                      strokeWidth="2"
                                    />
                                    <RNSVGPath
                                      d="M5.875 15.4141H16.8"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                          "strokeLinecap",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4280427042,
                                          "type": 0,
                                        }
                                      }
                                      strokeLinecap={1}
                                      strokeWidth="2"
                                    />
                                  </RNSVGGroup>
                                </RNSVGSvgView>
                                <Text
                                  color="main"
                                  ellipsizeMode="tail"
                                  fontSize={16}
                                  fontWeight="normal"
                                  horizontalTextAlign="left"
                                  numberOfLines={1}
                                  style={
                                    [
                                      {
                                        "color": "#000000",
                                        "fontFamily": "Rubik-Regular",
                                        "fontSize": 16,
                                        "textAlign": "left",
                                        "textAlignVertical": "center",
                                      },
                                      {
                                        "color": "#222222",
                                      },
                                    ]
                                  }
                                  verticalTextAlign="center"
                                >
                                  spam
                                </Text>
                              </View>
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
                                      "alignItems": "flex-end",
                                      "flex": 1,
                                    }
                                  }
                                />
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View
                    onFocusCapture={[Function]}
                    onLayout={[Function]}
                    style={null}
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
                        testID="channel_tile_design"
                      >
                        <View
                          style={
                            {
                              "paddingLeft": 12,
                              "paddingRight": 16,
                              "paddingVertical": 8,
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
                                  "flex": 1,
                                  "flexDirection": "row",
                                  "height": 20,
                                  "justifyContent": "space-between",
                                }
                              }
                            >
                              <View
                                style={
                                  {
                                    "alignItems": "center",
                                    "display": "flex",
                                    "flex": 1,
                                    "flexDirection": "row",
                                    "gap": 6,
                                  }
                                }
                              >
                                <RNSVGSvgView
                                  align="xMidYMid"
                                  bbHeight={18}
                                  bbWidth={18}
                                  fill="none"
                                  focusable={false}
                                  height={18}
                                  meetOrSlice={0}
                                  minX={0}
                                  minY={0}
                                  style={
                                    [
                                      {
                                        "backgroundColor": "transparent",
                                        "borderWidth": 0,
                                      },
                                      {
                                        "flex": 0,
                                        "height": 18,
                                        "width": 18,
                                      },
                                    ]
                                  }
                                  vbHeight={24}
                                  vbWidth={24}
                                  width={18}
                                >
                                  <RNSVGGroup
                                    fill={null}
                                    propList={
                                      [
                                        "fill",
                                      ]
                                    }
                                  >
                                    <RNSVGPath
                                      d="M15.7318 4.875L12.8818 19.125"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                          "strokeLinecap",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      strokeLinecap={1}
                                      strokeWidth="3"
                                    />
                                    <RNSVGPath
                                      d="M10.5355 4.875L7.68555 19.125"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                          "strokeLinecap",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      strokeLinecap={1}
                                      strokeWidth="3"
                                    />
                                    <RNSVGPath
                                      d="M6.8252 8.58594H17.7502"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                          "strokeLinecap",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      strokeLinecap={1}
                                      strokeWidth="3"
                                    />
                                    <RNSVGPath
                                      d="M5.875 15.4141H16.8"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                          "strokeLinecap",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      strokeLinecap={1}
                                      strokeWidth="3"
                                    />
                                  </RNSVGGroup>
                                </RNSVGSvgView>
                                <Text
                                  color="main"
                                  ellipsizeMode="tail"
                                  fontSize={16}
                                  fontWeight="medium"
                                  horizontalTextAlign="left"
                                  numberOfLines={1}
                                  style={
                                    [
                                      {
                                        "color": "#000000",
                                        "fontFamily": "Rubik-Medium",
                                        "fontSize": 16,
                                        "textAlign": "left",
                                        "textAlignVertical": "center",
                                      },
                                      {
                                        "color": "#000000",
                                      },
                                    ]
                                  }
                                  verticalTextAlign="center"
                                >
                                  design
                                </Text>
                              </View>
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
                                      "alignItems": "flex-end",
                                      "flex": 1,
                                    }
                                  }
                                >
                                  <View
                                    style={
                                      {
                                        "alignItems": "center",
                                        "backgroundColor": "#E42656",
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
                      </View>
                    </View>
                  </View>
                  <View
                    onFocusCapture={[Function]}
                    onLayout={[Function]}
                    style={null}
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
                        testID="channel_tile_qa"
                      >
                        <View
                          style={
                            {
                              "paddingLeft": 12,
                              "paddingRight": 16,
                              "paddingVertical": 8,
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
                                  "flex": 1,
                                  "flexDirection": "row",
                                  "height": 20,
                                  "justifyContent": "space-between",
                                }
                              }
                            >
                              <View
                                style={
                                  {
                                    "alignItems": "center",
                                    "display": "flex",
                                    "flex": 1,
                                    "flexDirection": "row",
                                    "gap": 6,
                                  }
                                }
                              >
                                <RNSVGSvgView
                                  align="xMidYMid"
                                  bbHeight={18}
                                  bbWidth={18}
                                  fill="none"
                                  focusable={false}
                                  height={18}
                                  meetOrSlice={0}
                                  minX={0}
                                  minY={0}
                                  style={
                                    [
                                      {
                                        "backgroundColor": "transparent",
                                        "borderWidth": 0,
                                      },
                                      {
                                        "flex": 0,
                                        "height": 18,
                                        "width": 18,
                                      },
                                    ]
                                  }
                                  vbHeight={24}
                                  vbWidth={24}
                                  width={18}
                                >
                                  <RNSVGGroup
                                    fill={null}
                                    propList={
                                      [
                                        "fill",
                                      ]
                                    }
                                  >
                                    <RNSVGPath
                                      d="M15.7318 4.875L12.8818 19.125"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                          "strokeLinecap",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4280427042,
                                          "type": 0,
                                        }
                                      }
                                      strokeLinecap={1}
                                      strokeWidth="2"
                                    />
                                    <RNSVGPath
                                      d="M10.5355 4.875L7.68555 19.125"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                          "strokeLinecap",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4280427042,
                                          "type": 0,
                                        }
                                      }
                                      strokeLinecap={1}
                                      strokeWidth="2"
                                    />
                                    <RNSVGPath
                                      d="M6.8252 8.58594H17.7502"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                          "strokeLinecap",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4280427042,
                                          "type": 0,
                                        }
                                      }
                                      strokeLinecap={1}
                                      strokeWidth="2"
                                    />
                                    <RNSVGPath
                                      d="M5.875 15.4141H16.8"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                          "strokeLinecap",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4280427042,
                                          "type": 0,
                                        }
                                      }
                                      strokeLinecap={1}
                                      strokeWidth="2"
                                    />
                                  </RNSVGGroup>
                                </RNSVGSvgView>
                                <Text
                                  color="main"
                                  ellipsizeMode="tail"
                                  fontSize={16}
                                  fontWeight="normal"
                                  horizontalTextAlign="left"
                                  numberOfLines={1}
                                  style={
                                    [
                                      {
                                        "color": "#000000",
                                        "fontFamily": "Rubik-Regular",
                                        "fontSize": 16,
                                        "textAlign": "left",
                                        "textAlignVertical": "center",
                                      },
                                      {
                                        "color": "#222222",
                                      },
                                    ]
                                  }
                                  verticalTextAlign="center"
                                >
                                  qa
                                </Text>
                              </View>
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
                                      "alignItems": "flex-end",
                                      "flex": 1,
                                    }
                                  }
                                />
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View
                    onFocusCapture={[Function]}
                    onLayout={[Function]}
                    style={null}
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
                        testID="channel_tile_private-chat"
                      >
                        <View
                          style={
                            {
                              "paddingLeft": 12,
                              "paddingRight": 16,
                              "paddingVertical": 8,
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
                                  "flex": 1,
                                  "flexDirection": "row",
                                  "height": 20,
                                  "justifyContent": "space-between",
                                }
                              }
                            >
                              <View
                                style={
                                  {
                                    "alignItems": "center",
                                    "display": "flex",
                                    "flex": 1,
                                    "flexDirection": "row",
                                    "gap": 6,
                                  }
                                }
                              >
                                <RNSVGSvgView
                                  align="xMidYMid"
                                  bbHeight={18}
                                  bbWidth={18}
                                  fill="#222222"
                                  focusable={false}
                                  height={18}
                                  meetOrSlice={0}
                                  minX={0}
                                  minY={0}
                                  style={
                                    [
                                      {
                                        "backgroundColor": "transparent",
                                        "borderWidth": 0,
                                      },
                                      {
                                        "flex": 0,
                                        "height": 18,
                                        "width": 18,
                                      },
                                    ]
                                  }
                                  vbHeight={24}
                                  vbWidth={24}
                                  width={18}
                                >
                                  <RNSVGGroup
                                    fill={
                                      {
                                        "payload": 4280427042,
                                        "type": 0,
                                      }
                                    }
                                    propList={
                                      [
                                        "fill",
                                      ]
                                    }
                                  >
                                    <RNSVGMask
                                      fill={
                                        {
                                          "payload": 4294967295,
                                          "type": 0,
                                        }
                                      }
                                      height="100%"
                                      maskContentUnits={1}
                                      maskType={0}
                                      maskUnits={0}
                                      name="a"
                                      propList={
                                        [
                                          "fill",
                                        ]
                                      }
                                      width="100%"
                                      x="0%"
                                      y="0%"
                                    >
                                      <RNSVGPath
                                        d="M5.5 11.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"
                                        fill={
                                          {
                                            "payload": 4278190080,
                                            "type": 0,
                                          }
                                        }
                                      />
                                    </RNSVGMask>
                                    <RNSVGPath
                                      d="M5.5 11.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"
                                      fill={
                                        {
                                          "payload": 4278190080,
                                          "type": 0,
                                        }
                                      }
                                      mask="a"
                                      propList={
                                        [
                                          "stroke",
                                          "strokeWidth",
                                        ]
                                      }
                                      stroke={
                                        {
                                          "payload": 4280427042,
                                          "type": 0,
                                        }
                                      }
                                      strokeWidth="4"
                                    />
                                    <RNSVGPath
                                      clipRule={0}
                                      d="M7.5 10.5h2V7a2.5 2.5 0 0 1 5 0v3.5h2V7a4.5 4.5 0 1 0-9 0z"
                                      fill={
                                        {
                                          "payload": 4280427042,
                                          "type": 0,
                                        }
                                      }
                                      fillRule={0}
                                      propList={
                                        [
                                          "fill",
                                          "fillRule",
                                          "strokeWidth",
                                        ]
                                      }
                                      strokeWidth="4"
                                    />
                                  </RNSVGGroup>
                                </RNSVGSvgView>
                                <Text
                                  color="main"
                                  ellipsizeMode="tail"
                                  fontSize={16}
                                  fontWeight="normal"
                                  horizontalTextAlign="left"
                                  numberOfLines={1}
                                  style={
                                    [
                                      {
                                        "color": "#000000",
                                        "fontFamily": "Rubik-Regular",
                                        "fontSize": 16,
                                        "textAlign": "left",
                                        "textAlignVertical": "center",
                                      },
                                      {
                                        "color": "#222222",
                                      },
                                    ]
                                  }
                                  verticalTextAlign="center"
                                >
                                  private-chat
                                </Text>
                              </View>
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
                                      "alignItems": "flex-end",
                                      "flex": 1,
                                    }
                                  }
                                />
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </RCTScrollView>
              <View
                style={
                  {
                    "alignContent": "center",
                    "alignItems": "center",
                    "backgroundColor": "#ffffff",
                    "flexDirection": "row",
                    "justifyContent": "space-between",
                    "paddingBottom": 8,
                    "paddingLeft": 16,
                    "paddingTop": 16,
                  }
                }
                testID="dm-list-title"
              >
                <Text
                  color="gray70"
                  fontSize={14}
                  fontWeight="medium"
                  horizontalTextAlign="left"
                  style={
                    [
                      {
                        "color": "#4C4C4C",
                        "fontFamily": "Rubik-Medium",
                        "fontSize": 14,
                        "textAlign": "left",
                        "textAlignVertical": "center",
                      },
                    ]
                  }
                  verticalTextAlign="center"
                >
                  Direct Messages
                </Text>
                <View
                  collapsable={false}
                  style={
                    {
                      "backgroundColor": "transparent",
                      "borderRadius": 18,
                      "height": 36,
                      "margin": 6,
                      "shadowColor": "#000",
                      "shadowOffset": {
                        "height": 0,
                        "width": 0,
                      },
                      "shadowOpacity": 0,
                      "shadowRadius": 0,
                      "width": 36,
                    }
                  }
                  testID="icon-button-container-outer-layer"
                >
                  <View
                    collapsable={false}
                    style={
                      {
                        "backgroundColor": "transparent",
                        "borderColor": "rgba(121, 116, 126, 1)",
                        "borderRadius": 18,
                        "borderWidth": 0,
                        "elevation": 0,
                        "flex": 1,
                        "overflow": "hidden",
                        "shadowColor": "#000",
                        "shadowOffset": {
                          "height": 0,
                          "width": 0,
                        },
                        "shadowOpacity": 0,
                        "shadowRadius": 0,
                      }
                    }
                    testID="icon-button-container"
                  >
                    <View
                      accessibilityComponentType="button"
                      accessibilityRole="button"
                      accessibilityState={
                        {
                          "busy": undefined,
                          "checked": undefined,
                          "disabled": true,
                          "expanded": undefined,
                          "selected": undefined,
                        }
                      }
                      accessibilityTraits="button"
                      accessibilityValue={
                        {
                          "max": undefined,
                          "min": undefined,
                          "now": undefined,
                          "text": undefined,
                        }
                      }
                      accessible={true}
                      centered={true}
                      collapsable={false}
                      focusable={true}
                      hitSlop={
                        {
                          "bottom": 6,
                          "left": 6,
                          "right": 6,
                          "top": 6,
                        }
                      }
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
                        [
                          {
                            "overflow": "hidden",
                          },
                          [
                            {
                              "alignItems": "center",
                              "flexGrow": 1,
                              "justifyContent": "center",
                            },
                            undefined,
                          ],
                        ]
                      }
                      testID="icon-button"
                    >
                      <Text
                        accessibilityElementsHidden={true}
                        importantForAccessibility="no-hide-descendants"
                        pointerEvents="none"
                        selectable={false}
                        style={
                          [
                            {
                              "backgroundColor": "transparent",
                            },
                            {
                              "color": "#4C4C4C",
                              "fontSize": 20,
                            },
                          ]
                        }
                      >
                        □
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <RCTScrollView
                getItem={[Function]}
                getItemCount={[Function]}
                keyExtractor={[Function]}
                onContentSizeChange={[Function]}
                onLayout={[Function]}
                onMomentumScrollBegin={[Function]}
                onMomentumScrollEnd={[Function]}
                onScroll={[Function]}
                onScrollBeginDrag={[Function]}
                onScrollEndDrag={[Function]}
                removeClippedSubviews={false}
                renderItem={[Function]}
                scrollEventThrottle={0.0001}
                stickyHeaderIndices={[]}
                style={
                  {
                    "backgroundColor": "#ffffff",
                  }
                }
                testID="dm-list"
                viewabilityConfigCallbackPairs={[]}
              >
                <View />
              </RCTScrollView>
            </View>
          </View>
        </RCTScrollView>
        <View
          collapsable={false}
          style={
            {
              "backgroundColor": "#461863",
              "borderRadius": 100,
              "bottom": 0,
              "margin": 16,
              "marginBottom": 24,
              "opacity": 1,
              "position": "absolute",
              "right": 0,
              "shadowColor": "#000",
              "shadowOffset": {
                "height": 0,
                "width": 0,
              },
              "shadowOpacity": 0,
              "shadowRadius": 0,
              "transform": [
                {
                  "scale": 1,
                },
              ],
            }
          }
          testID="fab-container-outer-layer"
        >
          <View
            collapsable={false}
            pointerEvents="auto"
            style={
              {
                "backgroundColor": "#461863",
                "borderRadius": 100,
                "flex": undefined,
                "shadowColor": "#000",
                "shadowOffset": {
                  "height": 0,
                  "width": 0,
                },
                "shadowOpacity": 0,
                "shadowRadius": 0,
              }
            }
            testID="fab-container"
          >
            <View
              accessibilityRole="button"
              accessibilityState={
                {
                  "busy": undefined,
                  "checked": undefined,
                  "disabled": true,
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
                [
                  {
                    "overflow": "hidden",
                  },
                  {
                    "borderRadius": 100,
                  },
                ]
              }
              testID="fab"
            >
              <View
                pointerEvents="none"
                style={
                  [
                    {
                      "alignItems": "center",
                      "flexDirection": "row",
                      "justifyContent": "center",
                    },
                    {
                      "borderRadius": 14,
                      "height": 56,
                      "width": 56,
                    },
                  ]
                }
                testID="fab-content"
              >
                <View
                  style={
                    [
                      {
                        "alignItems": "center",
                        "justifyContent": "center",
                      },
                      {
                        "height": 28,
                        "width": 28,
                      },
                    ]
                  }
                >
                  <View
                    collapsable={false}
                    style={
                      [
                        {
                          "bottom": 0,
                          "left": 0,
                          "position": "absolute",
                          "right": 0,
                          "top": 0,
                        },
                        {
                          "opacity": 1,
                          "transform": [
                            {
                              "rotate": "0deg",
                            },
                          ],
                        },
                      ]
                    }
                    testID="cross-fade-icon-current"
                  >
                    <Text
                      accessibilityElementsHidden={true}
                      importantForAccessibility="no-hide-descendants"
                      pointerEvents="none"
                      selectable={false}
                      style={
                        [
                          {
                            "backgroundColor": "transparent",
                          },
                          {
                            "color": "#ffffff",
                            "fontSize": 28,
                          },
                        ]
                      }
                    >
                      □
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    `)
  })
})

import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { ChannelTile } from './ChannelTile.component'

describe('ChannelTile component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <ChannelTile name={'general'} id={'general'} unread={false} isPublic={true} redirect={jest.fn()} />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
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
                "padding": 16,
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
                    fontSize={20}
                    horizontalTextAlign="left"
                    style={
                      [
                        {
                          "color": "#ffffff",
                          "fontFamily": "Rubik-Regular",
                          "fontSize": 20,
                          "textAlign": "left",
                          "textAlignVertical": "center",
                        },
                      ]
                    }
                    verticalTextAlign="center"
                  >
                    G
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
                        "alignItems": "center",
                        "display": "flex",
                        "flex": 8,
                        "flexDirection": "row",
                      }
                    }
                  >
                    <RNSVGSvgView
                      align="xMidYMid"
                      bbHeight={24}
                      bbWidth={24}
                      fill="none"
                      focusable={false}
                      height={24}
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
                            "height": 24,
                            "width": 24,
                          },
                        ]
                      }
                      vbHeight={24}
                      vbWidth={24}
                      width={24}
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
                              "payload": 4278190080,
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
                              "payload": 4278190080,
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
                              "payload": 4278190080,
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
        </View>
      </View>
    `)
  })

  it('should match inline snapshot (unread)', () => {
    const { toJSON } = renderComponent(
      <ChannelTile name={'general'} id={'general'} unread={true} isPublic={true} redirect={jest.fn()} />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
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
                "padding": 16,
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
                    fontSize={20}
                    horizontalTextAlign="left"
                    style={
                      [
                        {
                          "color": "#ffffff",
                          "fontFamily": "Rubik-Regular",
                          "fontSize": 20,
                          "textAlign": "left",
                          "textAlignVertical": "center",
                        },
                      ]
                    }
                    verticalTextAlign="center"
                  >
                    G
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
                        "alignItems": "center",
                        "display": "flex",
                        "flex": 8,
                        "flexDirection": "row",
                      }
                    }
                  >
                    <RNSVGSvgView
                      align="xMidYMid"
                      bbHeight={24}
                      bbWidth={24}
                      fill="none"
                      focusable={false}
                      height={24}
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
                            "height": 24,
                            "width": 24,
                          },
                        ]
                      }
                      vbHeight={24}
                      vbWidth={24}
                      width={24}
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
                              "payload": 4278190080,
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
                              "payload": 4278190080,
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
                              "payload": 4278190080,
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
        </View>
      </View>
    `)
  })

  it('should match inline snapshot (private)', () => {
    const { toJSON } = renderComponent(
      <ChannelTile name={'general'} id={'general'} unread={false} isPublic={false} redirect={jest.fn()} />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
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
                "padding": 16,
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
                      "backgroundColor": "#80B857",
                      "borderRadius": 4,
                      "height": 36,
                      "justifyContent": "center",
                      "width": 36,
                    }
                  }
                >
                  <Text
                    color="white"
                    fontSize={20}
                    horizontalTextAlign="left"
                    style={
                      [
                        {
                          "color": "#ffffff",
                          "fontFamily": "Rubik-Regular",
                          "fontSize": 20,
                          "textAlign": "left",
                          "textAlignVertical": "center",
                        },
                      ]
                    }
                    verticalTextAlign="center"
                  >
                    G
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
                        "alignItems": "center",
                        "display": "flex",
                        "flex": 8,
                        "flexDirection": "row",
                      }
                    }
                  >
                    <RNSVGSvgView
                      align="xMidYMid"
                      bbHeight={24}
                      bbWidth={24}
                      fill="#000000"
                      focusable={false}
                      height={24}
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
                            "height": 24,
                            "width": 24,
                          },
                        ]
                      }
                      vbHeight={24}
                      vbWidth={24}
                      width={24}
                    >
                      <RNSVGGroup
                        fill={
                          {
                            "payload": 4278190080,
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
                              "payload": 4278190080,
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
                              "payload": 4278190080,
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
        </View>
      </View>
    `)
  })
})

import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { ChannelTile } from './ChannelTile.component'
import { ChannelType } from '@quiet/types'

describe('ChannelTile component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <ChannelTile
        name={'general'}
        id={'general'}
        unread={false}
        isPublic={true}
        redirect={jest.fn()}
        channelType={ChannelType.CHANNEL}
      />
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
    `)
  })

  it('should match inline snapshot (unread)', () => {
    const { toJSON } = renderComponent(
      <ChannelTile
        name={'general'}
        id={'general'}
        unread={true}
        isPublic={true}
        redirect={jest.fn()}
        channelType={ChannelType.CHANNEL}
      />
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
    `)
  })

  it('should match inline snapshot (private)', () => {
    const { toJSON } = renderComponent(
      <ChannelTile
        name={'general'}
        id={'general'}
        unread={false}
        isPublic={false}
        redirect={jest.fn()}
        channelType={ChannelType.CHANNEL}
      />
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
    `)
  })
})

import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { ChannelMembership } from './ChannelMembership.component'

describe('ChannelMembership component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <ChannelMembership
        channelName={'private-channel'}
        channelId={'abc123'}
        community={undefined}
        userProfiles={{}}
        updateChannelMembership={jest.fn()}
        handleBackButton={jest.fn()}
      />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          {
            "backgroundColor": "#ffffff",
            "flex": 1,
          }
        }
        testID="channel-membership-component"
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
                    "height": 50,
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
                      "testUri": "../../../src/assets/icons/png/arrow_left.png",
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
            <View
              style={
                {
                  "alignContent": "center",
                  "alignItems": "center",
                  "display": "flex",
                  "flexDirection": "column",
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
                Add members
              </Text>
              <View
                style={
                  {
                    "alignItems": "center",
                    "display": "flex",
                    "flexDirection": "row",
                  }
                }
              >
                <RNSVGSvgView
                  align="xMidYMid"
                  bbHeight={16}
                  bbWidth={16}
                  fill="#000000"
                  focusable={false}
                  height={16}
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
                        "height": 16,
                        "width": 16,
                      },
                    ]
                  }
                  vbHeight={24}
                  vbWidth={24}
                  width={16}
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
                  fontSize={12}
                  horizontalTextAlign="left"
                  style={
                    [
                      {
                        "color": "#000000",
                        "fontFamily": "Rubik-Regular",
                        "fontSize": 12,
                        "textAlign": "left",
                        "textAlignVertical": "center",
                      },
                    ]
                  }
                  verticalTextAlign="center"
                >
                  private-channel
                </Text>
              </View>
            </View>
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
          <Text
            color="main"
            fontSize={10}
            horizontalTextAlign="left"
            style={
              [
                {
                  "color": "#000000",
                  "fontFamily": "Rubik-Regular",
                  "fontSize": 10,
                  "textAlign": "left",
                  "textAlignVertical": "center",
                },
                {
                  "color": "#7F7F7F",
                },
              ]
            }
            verticalTextAlign="center"
          >
            MEMBERS
          </Text>
          <RCTScrollView
            ItemSeparatorComponent={[Function]}
            data={[]}
            extraData={
              {
                "statusUpdatedTs": 0,
                "userProfiles": {},
              }
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
            testID="channel_membership_options_list_abc123"
            viewabilityConfigCallbackPairs={[]}
          >
            <View />
          </RCTScrollView>
          <View
            style={
              {
                "paddingTop": 28,
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
                  "borderRadius": 8,
                  "justifyContent": "center",
                  "minHeight": 45,
                  "paddingHorizontal": 20,
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
                Update Channel Membership
              </Text>
            </View>
          </View>
          <View
            style={
              {
                "paddingTop": 24,
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
                  "backgroundColor": "transparent",
                  "borderRadius": 8,
                  "justifyContent": "center",
                  "minHeight": 45,
                  "paddingHorizontal": 20,
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

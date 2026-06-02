import { getBaseTypesFactory, getSocketFactory } from '@quiet/state-manager'
import { UserProfile } from '@quiet/types'
import { render } from '@testing-library/react-native'
import { FactoryGirl } from 'factory-girl'
import React from 'react'
import { Provider } from 'react-redux'
import { ReactTestInstance } from 'react-test-renderer'

import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import { createLogger } from '../../../utils/logger'
import { UpdateChannelMembership } from './UpdateChannelMembership.component'

const logger = createLogger('UpdateChannelMembership:test')

describe('UpdateChannelMembership component', () => {
  let factory: FactoryGirl
  let baseTypesFactory: FactoryGirl

  beforeEach(async () => {
    factory = await getSocketFactory()
    baseTypesFactory = await getBaseTypesFactory()
  })

  const findByTestId = async (
    rendered: ReturnType<typeof render>,
    testID: string,
    throwOnNotFound = false
  ): Promise<ReactTestInstance | undefined> => {
    try {
      const element = await rendered.findByTestId(testID)
      return element
    } catch (e) {
      if (throwOnNotFound) {
        throw e
      }
      return undefined
    }
  }

  it('displays spinner when user profiles is empty', async () => {
    const channelName = 'private-channel'
    const channelId = 'abc123'
    const rendered = renderComponent(
      <UpdateChannelMembership
        channelName={channelName}
        channelId={channelId}
        community={undefined}
        userProfiles={{}}
        handleBackButton={jest.fn()}
        updateChannelMembership={jest.fn()}
      />
    )

    expect(await findByTestId(rendered, `update-channel-membership-list-spinner-${channelId}`)).toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-${channelId}`)).not.toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-nomembers-${channelId}`)).not.toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-header-${channelId}`)).not.toBeDefined()
    expect(rendered.toJSON()).toMatchInlineSnapshot(`
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
          onLayout={[Function]}
          style={
            [
              {
                "flex": 1,
                "marginBottom": 16,
              },
              {
                "paddingBottom": 0,
              },
            ]
          }
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
                <View
                  style={
                    {
                      "alignContent": "center",
                      "alignItems": "center",
                      "display": "flex",
                      "flexDirection": "row",
                      "gap": 6,
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
                  <Text
                    color="main"
                    fontSize={16}
                    fontWeight="normal"
                    horizontalTextAlign="left"
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
                          "color": "#7F7F7F",
                        },
                      ]
                    }
                    verticalTextAlign="center"
                  />
                </View>
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
                testID="submit"
              >
                <View
                  style={
                    {
                      "alignItems": "center",
                      "justifyContent": "center",
                    }
                  }
                >
                  <Text
                    color="main"
                    fontSize={16}
                    horizontalTextAlign="left"
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
                          "color": "#2373EA",
                        },
                      ]
                    }
                    verticalTextAlign="center"
                  >
                    Done
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View
            style={
              {
                "display": "flex",
                "flexDirection": "column",
                "gap": 32,
                "paddingTop": 16,
              }
            }
          >
            <View
              testID="update-channel-membership-input-abc123"
            >
              <View
                style={
                  {
                    "display": "flex",
                    "flexDirection": "column",
                    "paddingHorizontal": 16,
                  }
                }
              >
                <View
                  accessibilityState={
                    {
                      "busy": undefined,
                      "checked": undefined,
                      "disabled": false,
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
                  round={false}
                  style={
                    [
                      {
                        "backgroundColor": "#ffffff",
                        "borderColor": "#C4C4C4",
                        "borderRadius": 4,
                        "borderWidth": 1,
                        "flexGrow": 1,
                        "height": 56,
                        "justifyContent": "center",
                        "paddingLeft": 16,
                        "paddingRight": 16,
                      },
                      {
                        "height": 54,
                      },
                    ]
                  }
                >
                  <TextInput
                    autoCorrect={false}
                    editable={true}
                    height={54}
                    keyboardType="email-address"
                    maxLength={20}
                    onChangeText={[Function]}
                    onContentSizeChange={[Function]}
                    placeholder="E.g. @jane123"
                    placeholderTextColor="#999999"
                    style={
                      [
                        {
                          "height": 54,
                          "paddingBottom": 12,
                          "paddingTop": 12,
                          "textAlignVertical": "center",
                        },
                      ]
                    }
                    testID="input"
                  />
                </View>
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
                      {
                        "color": "#999999",
                        "fontWeight": 400,
                        "lineHeight": 16,
                        "paddingHorizontal": 8,
                        "paddingTop": 6,
                      },
                    ]
                  }
                  verticalTextAlign="center"
                >
                  Add members with '@'
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
                  style={
                    {
                      "backgroundColor": "#F0F0F0",
                      "height": 1,
                    }
                  }
                />
              </View>
            </View>
            <View>
              <View
                style={
                  {
                    "paddingVertical": 16,
                  }
                }
                testID="update-channel-membership-list-spinner-abc123"
              >
                <View
                  style={
                    {
                      "alignItems": "center",
                      "backgroundColor": "#ffffff",
                      "flex": 1,
                      "justifyContent": "center",
                    }
                  }
                >
                  <ActivityIndicator
                    color="#67BFD3"
                    size="large"
                  />
                  <Text
                    color="main"
                    fontSize={14}
                    horizontalTextAlign="center"
                    style={
                      [
                        {
                          "color": "#000000",
                          "fontFamily": "Rubik-Regular",
                          "fontSize": 14,
                          "textAlign": "center",
                          "textAlignVertical": "center",
                        },
                        {
                          "margin": 10,
                          "maxWidth": 200,
                        },
                      ]
                    }
                    verticalTextAlign="center"
                  >
                    Loading member list
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    `)
  })

  it('displays list of addable users when provided', async () => {
    const channelName = 'private-channel'
    const channelId = 'abc123'
    const userId = 'foobar'
    const nonMemberUserId = 'barbaz'
    const userProfiles: Record<string, UserProfile> = {
      [userId]: await baseTypesFactory.create('UserProfile', {
        userId,
        nickname: 'foo',
        channels: [channelId],
        profilePhoto: undefined,
        photo: 'foobar',
      }),
      [nonMemberUserId]: await baseTypesFactory.create('UserProfile', {
        userId: nonMemberUserId,
        nickname: 'baz',
        channels: [],
        profilePhoto: undefined,
        photo: 'foobar',
      }),
    }
    const rendered = renderComponent(
      <UpdateChannelMembership
        channelName={channelName}
        channelId={channelId}
        community={undefined}
        userProfiles={userProfiles}
        handleBackButton={jest.fn()}
        updateChannelMembership={jest.fn()}
      />
    )

    expect(await findByTestId(rendered, `update-channel-membership-list-spinner-${channelId}`)).not.toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-${channelId}`)).toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-nomembers-${channelId}`)).not.toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-header-${channelId}`)).toBeDefined()
    expect(
      await findByTestId(rendered, `update-channel-membership-list-item-${channelId}-${nonMemberUserId}`)
    ).toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-item-${channelId}-${userId}`)).not.toBeDefined()
    expect(rendered.toJSON()).toMatchInlineSnapshot(`
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
          onLayout={[Function]}
          style={
            [
              {
                "flex": 1,
                "marginBottom": 16,
              },
              {
                "paddingBottom": 0,
              },
            ]
          }
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
                <View
                  style={
                    {
                      "alignContent": "center",
                      "alignItems": "center",
                      "display": "flex",
                      "flexDirection": "row",
                      "gap": 6,
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
                  <Text
                    color="main"
                    fontSize={16}
                    fontWeight="normal"
                    horizontalTextAlign="left"
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
                          "color": "#7F7F7F",
                        },
                      ]
                    }
                    verticalTextAlign="center"
                  />
                </View>
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
                testID="submit"
              >
                <View
                  style={
                    {
                      "alignItems": "center",
                      "justifyContent": "center",
                    }
                  }
                >
                  <Text
                    color="main"
                    fontSize={16}
                    horizontalTextAlign="left"
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
                          "color": "#2373EA",
                        },
                      ]
                    }
                    verticalTextAlign="center"
                  >
                    Done
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View
            style={
              {
                "display": "flex",
                "flexDirection": "column",
                "gap": 32,
                "paddingTop": 16,
              }
            }
          >
            <View
              testID="update-channel-membership-input-abc123"
            >
              <View
                style={
                  {
                    "display": "flex",
                    "flexDirection": "column",
                    "paddingHorizontal": 16,
                  }
                }
              >
                <View
                  accessibilityState={
                    {
                      "busy": undefined,
                      "checked": undefined,
                      "disabled": false,
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
                  round={false}
                  style={
                    [
                      {
                        "backgroundColor": "#ffffff",
                        "borderColor": "#C4C4C4",
                        "borderRadius": 4,
                        "borderWidth": 1,
                        "flexGrow": 1,
                        "height": 56,
                        "justifyContent": "center",
                        "paddingLeft": 16,
                        "paddingRight": 16,
                      },
                      {
                        "height": 54,
                      },
                    ]
                  }
                >
                  <TextInput
                    autoCorrect={false}
                    editable={true}
                    height={54}
                    keyboardType="email-address"
                    maxLength={20}
                    onChangeText={[Function]}
                    onContentSizeChange={[Function]}
                    placeholder="E.g. @jane123"
                    placeholderTextColor="#999999"
                    style={
                      [
                        {
                          "height": 54,
                          "paddingBottom": 12,
                          "paddingTop": 12,
                          "textAlignVertical": "center",
                        },
                      ]
                    }
                    testID="input"
                  />
                </View>
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
                      {
                        "color": "#999999",
                        "fontWeight": 400,
                        "lineHeight": 16,
                        "paddingHorizontal": 8,
                        "paddingTop": 6,
                      },
                    ]
                  }
                  verticalTextAlign="center"
                >
                  Add members with '@'
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
                  style={
                    {
                      "backgroundColor": "#F0F0F0",
                      "height": 1,
                    }
                  }
                />
              </View>
            </View>
            <View>
              <View>
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
                        "paddingHorizontal": 16,
                      },
                    ]
                  }
                  testID="update-channel-membership-list-header-abc123"
                  verticalTextAlign="center"
                >
                  MEMBERS
                </Text>
                <RCTScrollView
                  ItemSeparatorComponent={[Function]}
                  data={
                    [
                      1,
                    ]
                  }
                  extraData={
                    {
                      "options": [
                        {
                          "hide": true,
                          "id": "foobar",
                          "index": 0,
                          "label": "foo",
                          "mutable": false,
                          "selected": true,
                        },
                        {
                          "hide": false,
                          "id": "barbaz",
                          "index": 1,
                          "label": "baz",
                          "mutable": true,
                          "selected": false,
                        },
                      ],
                      "visibleOptionsIndices": Set {
                        1,
                      },
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
                  testID="update-channel-membership-list-abc123"
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
                            "alignContent": "center",
                            "alignItems": "center",
                            "display": "flex",
                            "flexDirection": "row",
                            "gap": 8,
                            "height": "auto",
                            "paddingHorizontal": 16,
                            "paddingVertical": 4,
                          }
                        }
                      >
                        <View
                          accessibilityLiveRegion="polite"
                          accessibilityRole="checkbox"
                          accessibilityState={
                            {
                              "busy": undefined,
                              "checked": false,
                              "disabled": false,
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
                          color="#7F7F7F"
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
                                "borderRadius": 18,
                                "height": 36,
                                "padding": 6,
                                "width": 36,
                              },
                            ]
                          }
                          testID="update-channel-membership-list-item-abc123-barbaz"
                          uncheckedColor="#7F7F7F"
                        >
                          <View
                            collapsable={false}
                            style={
                              {
                                "transform": [
                                  {
                                    "scale": 1,
                                  },
                                ],
                              }
                            }
                          >
                            <Text
                              accessibilityElementsHidden={true}
                              allowFontScaling={false}
                              importantForAccessibility="no-hide-descendants"
                              pointerEvents="none"
                              selectable={false}
                              style={
                                [
                                  {
                                    "backgroundColor": "transparent",
                                  },
                                  {
                                    "color": "#7F7F7F",
                                    "fontSize": 24,
                                  },
                                ]
                              }
                            >
                              □
                            </Text>
                            <View
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
                                    "alignItems": "center",
                                    "justifyContent": "center",
                                  },
                                ]
                              }
                            >
                              <View
                                collapsable={false}
                                style={
                                  {
                                    "borderColor": "#7F7F7F",
                                    "borderWidth": 0,
                                    "height": 14,
                                    "width": 14,
                                  }
                                }
                              />
                            </View>
                          </View>
                        </View>
                        <View
                          style={
                            {
                              "alignContent": "center",
                              "alignItems": "center",
                              "display": "flex",
                              "flexDirection": "row",
                              "gap": 16,
                              "paddingVertical": 11,
                            }
                          }
                        >
                          <Image
                            alt="baz's profile image"
                            source={
                              {
                                "uri": "foobar",
                              }
                            }
                            style={
                              {
                                "borderRadius": 4,
                                "height": 32,
                                "width": 32,
                              }
                            }
                          />
                          <Text
                            color="main"
                            fontSize={16}
                            horizontalTextAlign="left"
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
                                  "color": "#000000",
                                },
                              ]
                            }
                            verticalTextAlign="center"
                          >
                            baz
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </RCTScrollView>
                <View
                  style={
                    {
                      "backgroundColor": "#F0F0F0",
                      "height": 1,
                    }
                  }
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    `)
  })

  it('displays message when no members are available to add', async () => {
    const channelName = 'private-channel'
    const channelId = 'abc123'
    const userId = 'foobar'
    const secondUserId = 'barbaz'
    const userProfiles: Record<string, UserProfile> = {
      [userId]: await baseTypesFactory.create('UserProfile', {
        userId,
        nickname: 'foo',
        channels: [channelId],
      }),
      [secondUserId]: await baseTypesFactory.create('UserProfile', {
        userId: secondUserId,
        nickname: 'baz',
        channels: [channelId],
      }),
    }
    const rendered = renderComponent(
      <UpdateChannelMembership
        channelName={channelName}
        channelId={channelId}
        community={undefined}
        userProfiles={userProfiles}
        handleBackButton={jest.fn()}
        updateChannelMembership={jest.fn()}
      />
    )

    expect(await findByTestId(rendered, `update-channel-membership-list-spinner-${channelId}`)).not.toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-${channelId}`)).not.toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-nomembers-${channelId}`)).toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-header-${channelId}`)).toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-item-${channelId}-${userId}`)).not.toBeDefined()
    expect(
      await findByTestId(rendered, `update-channel-membership-list-item-${channelId}-${secondUserId}`)
    ).not.toBeDefined()
    expect(rendered.toJSON()).toMatchInlineSnapshot(`
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
          onLayout={[Function]}
          style={
            [
              {
                "flex": 1,
                "marginBottom": 16,
              },
              {
                "paddingBottom": 0,
              },
            ]
          }
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
                <View
                  style={
                    {
                      "alignContent": "center",
                      "alignItems": "center",
                      "display": "flex",
                      "flexDirection": "row",
                      "gap": 6,
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
                  <Text
                    color="main"
                    fontSize={16}
                    fontWeight="normal"
                    horizontalTextAlign="left"
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
                          "color": "#7F7F7F",
                        },
                      ]
                    }
                    verticalTextAlign="center"
                  />
                </View>
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
                testID="submit"
              >
                <View
                  style={
                    {
                      "alignItems": "center",
                      "justifyContent": "center",
                    }
                  }
                >
                  <Text
                    color="main"
                    fontSize={16}
                    horizontalTextAlign="left"
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
                          "color": "#2373EA",
                        },
                      ]
                    }
                    verticalTextAlign="center"
                  >
                    Done
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View
            style={
              {
                "display": "flex",
                "flexDirection": "column",
                "gap": 32,
                "paddingTop": 16,
              }
            }
          >
            <View
              testID="update-channel-membership-input-abc123"
            >
              <View
                style={
                  {
                    "display": "flex",
                    "flexDirection": "column",
                    "paddingHorizontal": 16,
                  }
                }
              >
                <View
                  accessibilityState={
                    {
                      "busy": undefined,
                      "checked": undefined,
                      "disabled": false,
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
                  round={false}
                  style={
                    [
                      {
                        "backgroundColor": "#ffffff",
                        "borderColor": "#C4C4C4",
                        "borderRadius": 4,
                        "borderWidth": 1,
                        "flexGrow": 1,
                        "height": 56,
                        "justifyContent": "center",
                        "paddingLeft": 16,
                        "paddingRight": 16,
                      },
                      {
                        "height": 54,
                      },
                    ]
                  }
                >
                  <TextInput
                    autoCorrect={false}
                    editable={true}
                    height={54}
                    keyboardType="email-address"
                    maxLength={20}
                    onChangeText={[Function]}
                    onContentSizeChange={[Function]}
                    placeholder="E.g. @jane123"
                    placeholderTextColor="#999999"
                    style={
                      [
                        {
                          "height": 54,
                          "paddingBottom": 12,
                          "paddingTop": 12,
                          "textAlignVertical": "center",
                        },
                      ]
                    }
                    testID="input"
                  />
                </View>
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
                      {
                        "color": "#999999",
                        "fontWeight": 400,
                        "lineHeight": 16,
                        "paddingHorizontal": 8,
                        "paddingTop": 6,
                      },
                    ]
                  }
                  verticalTextAlign="center"
                >
                  Add members with '@'
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
                  style={
                    {
                      "backgroundColor": "#F0F0F0",
                      "height": 1,
                    }
                  }
                />
              </View>
            </View>
            <View>
              <View>
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
                        "paddingHorizontal": 16,
                      },
                    ]
                  }
                  testID="update-channel-membership-list-header-abc123"
                  verticalTextAlign="center"
                >
                  MEMBERS
                </Text>
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
                      {
                        "color": "#999999",
                        "fontStyle": "italic",
                        "paddingHorizontal": 16,
                        "paddingVertical": 16,
                      },
                    ]
                  }
                  testID="update-channel-membership-list-nomembers-abc123"
                  verticalTextAlign="center"
                >
                  No members to add
                </Text>
                <View
                  style={
                    {
                      "backgroundColor": "#F0F0F0",
                      "height": 1,
                    }
                  }
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    `)
  })
})

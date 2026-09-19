import { getBaseTypesFactory, getSocketFactory } from '@quiet/state-manager'
import { ChannelType, UserProfile } from '@quiet/types'
import { fireEvent, render, within } from '@testing-library/react-native'
import { FactoryGirl } from 'factory-girl'
import React from 'react'
import { Image } from 'react-native'
import { Provider } from 'react-redux'
import { ReactTestInstance } from 'react-test-renderer'

import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import { createLogger } from '../../../utils/logger'
import { UpdateChannelMembership } from './UpdateChannelMembership.component'
import { UpdateChannelMembershipList } from './UpdateChannelMembershipList.component'
import type { DmChannelUserData } from '../../ProfilePhoto/ProfilePhoto.types'

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

  // Everyone in the community is already in this channel, so there is nobody left to add. That is
  // an answer, not a pending load: this screen used to spin here forever.
  it('shows the empty state, not a spinner, when there is nobody left to add', async () => {
    const channelName = 'private-channel'
    const channelId = 'abc123'
    const rendered = renderComponent(
      <UpdateChannelMembership
        channelName={channelName}
        channelTitle={channelName}
        channelType={ChannelType.CHANNEL}
        channelIsPublic={false}
        channelId={channelId}
        community={undefined}
        nonMembers={{}}
        handleBackButton={jest.fn()}
        updateChannelMembership={jest.fn()}
      />
    )

    expect(await findByTestId(rendered, `update-channel-membership-list-spinner-${channelId}`)).not.toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-${channelId}`)).not.toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-nomembers-${channelId}`)).toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-header-${channelId}`)).toBeDefined()
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
                  "maxHeight": 64,
                  "minHeight": 60,
                },
              ]
            }
          >
            <View
              style={
                {
                  "alignSelf": "stretch",
                  "flex": 1,
                }
              }
            >
              <View
                accessibilityLabel="Close"
                accessibilityRole="button"
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
                hitSlop={
                  {
                    "bottom": 8,
                    "left": 8,
                    "right": 8,
                    "top": 8,
                  }
                }
                onClick={[Function]}
                onResponderGrant={[Function]}
                onResponderMove={[Function]}
                onResponderRelease={[Function]}
                onResponderTerminate={[Function]}
                onResponderTerminationRequest={[Function]}
                onStartShouldSetResponder={[Function]}
                style={
                  {
                    "flex": 1,
                    "opacity": 1,
                  }
                }
                testID="appbar_action_item"
              >
                <View
                  style={
                    {
                      "alignItems": "center",
                      "flex": 1,
                      "justifyContent": "center",
                      "minHeight": 44,
                      "width": 64,
                    }
                  }
                >
                  <Image
                    accessible={false}
                    resizeMethod="resize"
                    resizeMode="cover"
                    source={
                      {
                        "testUri": "../../../src/assets/icons/png/icon_close.png",
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
                    testID="channel-membership-private-icon"
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
                  "alignSelf": "stretch",
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
                hitSlop={
                  {
                    "bottom": 8,
                    "left": 8,
                    "right": 8,
                    "top": 8,
                  }
                }
                onClick={[Function]}
                onResponderGrant={[Function]}
                onResponderMove={[Function]}
                onResponderRelease={[Function]}
                onResponderTerminate={[Function]}
                onResponderTerminationRequest={[Function]}
                onStartShouldSetResponder={[Function]}
                style={
                  {
                    "flex": 1,
                    "opacity": 1,
                  }
                }
                testID="submit"
              >
                <View
                  style={
                    {
                      "alignItems": "center",
                      "flex": 1,
                      "justifyContent": "center",
                      "minHeight": 44,
                      "minWidth": 44,
                      "paddingHorizontal": 8,
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
              }
            }
          >
            <View
              style={
                {
                  "borderBottomColor": "#F0F0F0",
                  "borderBottomWidth": 1,
                  "paddingBottom": 16,
                  "paddingHorizontal": 16,
                  "paddingTop": 16,
                }
              }
              testID="update-channel-membership-input-abc123"
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
                  {
                    "backgroundColor": "#ffffff",
                    "borderColor": "#E5E5E5",
                    "borderRadius": 16,
                    "borderWidth": 1,
                    "justifyContent": "center",
                    "minHeight": 42,
                    "paddingHorizontal": 16,
                    "paddingVertical": 8,
                  }
                }
              >
                <View
                  style={
                    {
                      "alignItems": "center",
                      "flexDirection": "row",
                      "flexWrap": "wrap",
                      "gap": 4,
                    }
                  }
                >
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={true}
                    keyboardType="email-address"
                    maxLength={20}
                    onChangeText={[Function]}
                    placeholder="E.g. @jane123"
                    placeholderTextColor="#7F7F7F"
                    style={
                      {
                        "color": "#222222",
                        "flexGrow": 1,
                        "fontSize": 14,
                        "lineHeight": 20,
                        "minWidth": 96,
                        "padding": 0,
                      }
                    }
                    testID="input"
                  />
                </View>
              </View>
            </View>
            <View>
              <View>
                <Text
                  color="main"
                  fontSize={10}
                  fontWeight="medium"
                  horizontalTextAlign="left"
                  style={
                    [
                      {
                        "color": "#000000",
                        "fontFamily": "Rubik-Medium",
                        "fontSize": 10,
                        "textAlign": "left",
                        "textAlignVertical": "center",
                      },
                      {
                        "color": "#7F7F7F",
                        "letterSpacing": 1,
                        "lineHeight": 16,
                        "paddingBottom": 8,
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
    const nonMembers: { [userId: string]: DmChannelUserData } = {}
    Object.entries(userProfiles).forEach(([userId, userProfile]) => {
      nonMembers[userId] = {
        connected: true,
        user: userProfile,
      }
    })
    const rendered = renderComponent(
      <UpdateChannelMembership
        channelName={channelName}
        channelTitle={channelName}
        channelType={ChannelType.CHANNEL}
        channelIsPublic={false}
        channelId={channelId}
        community={undefined}
        nonMembers={nonMembers}
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
                  "maxHeight": 64,
                  "minHeight": 60,
                },
              ]
            }
          >
            <View
              style={
                {
                  "alignSelf": "stretch",
                  "flex": 1,
                }
              }
            >
              <View
                accessibilityLabel="Close"
                accessibilityRole="button"
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
                hitSlop={
                  {
                    "bottom": 8,
                    "left": 8,
                    "right": 8,
                    "top": 8,
                  }
                }
                onClick={[Function]}
                onResponderGrant={[Function]}
                onResponderMove={[Function]}
                onResponderRelease={[Function]}
                onResponderTerminate={[Function]}
                onResponderTerminationRequest={[Function]}
                onStartShouldSetResponder={[Function]}
                style={
                  {
                    "flex": 1,
                    "opacity": 1,
                  }
                }
                testID="appbar_action_item"
              >
                <View
                  style={
                    {
                      "alignItems": "center",
                      "flex": 1,
                      "justifyContent": "center",
                      "minHeight": 44,
                      "width": 64,
                    }
                  }
                >
                  <Image
                    accessible={false}
                    resizeMethod="resize"
                    resizeMode="cover"
                    source={
                      {
                        "testUri": "../../../src/assets/icons/png/icon_close.png",
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
                    testID="channel-membership-private-icon"
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
                  "alignSelf": "stretch",
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
                hitSlop={
                  {
                    "bottom": 8,
                    "left": 8,
                    "right": 8,
                    "top": 8,
                  }
                }
                onClick={[Function]}
                onResponderGrant={[Function]}
                onResponderMove={[Function]}
                onResponderRelease={[Function]}
                onResponderTerminate={[Function]}
                onResponderTerminationRequest={[Function]}
                onStartShouldSetResponder={[Function]}
                style={
                  {
                    "flex": 1,
                    "opacity": 1,
                  }
                }
                testID="submit"
              >
                <View
                  style={
                    {
                      "alignItems": "center",
                      "flex": 1,
                      "justifyContent": "center",
                      "minHeight": 44,
                      "minWidth": 44,
                      "paddingHorizontal": 8,
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
              }
            }
          >
            <View
              style={
                {
                  "borderBottomColor": "#F0F0F0",
                  "borderBottomWidth": 1,
                  "paddingBottom": 16,
                  "paddingHorizontal": 16,
                  "paddingTop": 16,
                }
              }
              testID="update-channel-membership-input-abc123"
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
                  {
                    "backgroundColor": "#ffffff",
                    "borderColor": "#E5E5E5",
                    "borderRadius": 16,
                    "borderWidth": 1,
                    "justifyContent": "center",
                    "minHeight": 42,
                    "paddingHorizontal": 16,
                    "paddingVertical": 8,
                  }
                }
              >
                <View
                  style={
                    {
                      "alignItems": "center",
                      "flexDirection": "row",
                      "flexWrap": "wrap",
                      "gap": 4,
                    }
                  }
                >
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={true}
                    keyboardType="email-address"
                    maxLength={20}
                    onChangeText={[Function]}
                    placeholder="E.g. @jane123"
                    placeholderTextColor="#7F7F7F"
                    style={
                      {
                        "color": "#222222",
                        "flexGrow": 1,
                        "fontSize": 14,
                        "lineHeight": 20,
                        "minWidth": 96,
                        "padding": 0,
                      }
                    }
                    testID="input"
                  />
                </View>
              </View>
            </View>
            <View>
              <View>
                <Text
                  color="main"
                  fontSize={10}
                  fontWeight="medium"
                  horizontalTextAlign="left"
                  style={
                    [
                      {
                        "color": "#000000",
                        "fontFamily": "Rubik-Medium",
                        "fontSize": 10,
                        "textAlign": "left",
                        "textAlignVertical": "center",
                      },
                      {
                        "color": "#7F7F7F",
                        "letterSpacing": 1,
                        "lineHeight": 16,
                        "paddingBottom": 8,
                        "paddingHorizontal": 16,
                      },
                    ]
                  }
                  testID="update-channel-membership-list-header-abc123"
                  verticalTextAlign="center"
                >
                  MEMBERS
                </Text>
                <View
                  style={
                    {
                      "flexShrink": 1,
                      "maxHeight": undefined,
                    }
                  }
                >
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
                    scrollEnabled={true}
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
                          testID="update-channel-membership-list-row-abc123-barbaz"
                        >
                          <View
                            style={
                              {
                                "alignContent": "center",
                                "alignItems": "center",
                                "display": "flex",
                                "flexDirection": "row",
                                "gap": 8,
                                "height": 54,
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
                                  "flex": 1,
                                  "flexDirection": "row",
                                  "gap": 16,
                                  "paddingVertical": 11,
                                }
                              }
                            >
                              <View
                                style={{}}
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
                                      "padding": 0,
                                      "width": 32,
                                    }
                                  }
                                />
                                <Text
                                  collapsable={false}
                                  numberOfLines={1}
                                  style={
                                    {
                                      "alignSelf": "flex-end",
                                      "backgroundColor": "#80B857",
                                      "borderColor": "#ffffff",
                                      "borderRadius": 5.5,
                                      "borderWidth": 1,
                                      "color": "rgba(255, 255, 255, 1)",
                                      "fontSize": 5.5,
                                      "height": 11,
                                      "lineHeight": 5.5,
                                      "minWidth": 11,
                                      "opacity": 1,
                                      "overflow": "hidden",
                                      "paddingHorizontal": 3,
                                      "position": "absolute",
                                      "right": -4,
                                      "textAlign": "center",
                                      "textAlignVertical": "center",
                                      "top": 23,
                                    }
                                  }
                                />
                              </View>
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
                    </View>
                  </RCTScrollView>
                </View>
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
    const nonMembers: { [userId: string]: DmChannelUserData } = {}
    Object.entries(userProfiles).forEach(([userId, userProfile]) => {
      nonMembers[userId] = {
        connected: true,
        user: userProfile,
      }
    })
    const rendered = renderComponent(
      <UpdateChannelMembership
        channelName={channelName}
        channelTitle={channelName}
        channelType={ChannelType.CHANNEL}
        channelIsPublic={false}
        channelId={channelId}
        community={undefined}
        nonMembers={nonMembers}
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
                  "maxHeight": 64,
                  "minHeight": 60,
                },
              ]
            }
          >
            <View
              style={
                {
                  "alignSelf": "stretch",
                  "flex": 1,
                }
              }
            >
              <View
                accessibilityLabel="Close"
                accessibilityRole="button"
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
                hitSlop={
                  {
                    "bottom": 8,
                    "left": 8,
                    "right": 8,
                    "top": 8,
                  }
                }
                onClick={[Function]}
                onResponderGrant={[Function]}
                onResponderMove={[Function]}
                onResponderRelease={[Function]}
                onResponderTerminate={[Function]}
                onResponderTerminationRequest={[Function]}
                onStartShouldSetResponder={[Function]}
                style={
                  {
                    "flex": 1,
                    "opacity": 1,
                  }
                }
                testID="appbar_action_item"
              >
                <View
                  style={
                    {
                      "alignItems": "center",
                      "flex": 1,
                      "justifyContent": "center",
                      "minHeight": 44,
                      "width": 64,
                    }
                  }
                >
                  <Image
                    accessible={false}
                    resizeMethod="resize"
                    resizeMode="cover"
                    source={
                      {
                        "testUri": "../../../src/assets/icons/png/icon_close.png",
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
                    testID="channel-membership-private-icon"
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
                  "alignSelf": "stretch",
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
                hitSlop={
                  {
                    "bottom": 8,
                    "left": 8,
                    "right": 8,
                    "top": 8,
                  }
                }
                onClick={[Function]}
                onResponderGrant={[Function]}
                onResponderMove={[Function]}
                onResponderRelease={[Function]}
                onResponderTerminate={[Function]}
                onResponderTerminationRequest={[Function]}
                onStartShouldSetResponder={[Function]}
                style={
                  {
                    "flex": 1,
                    "opacity": 1,
                  }
                }
                testID="submit"
              >
                <View
                  style={
                    {
                      "alignItems": "center",
                      "flex": 1,
                      "justifyContent": "center",
                      "minHeight": 44,
                      "minWidth": 44,
                      "paddingHorizontal": 8,
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
              }
            }
          >
            <View
              style={
                {
                  "borderBottomColor": "#F0F0F0",
                  "borderBottomWidth": 1,
                  "paddingBottom": 16,
                  "paddingHorizontal": 16,
                  "paddingTop": 16,
                }
              }
              testID="update-channel-membership-input-abc123"
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
                  {
                    "backgroundColor": "#ffffff",
                    "borderColor": "#E5E5E5",
                    "borderRadius": 16,
                    "borderWidth": 1,
                    "justifyContent": "center",
                    "minHeight": 42,
                    "paddingHorizontal": 16,
                    "paddingVertical": 8,
                  }
                }
              >
                <View
                  style={
                    {
                      "alignItems": "center",
                      "flexDirection": "row",
                      "flexWrap": "wrap",
                      "gap": 4,
                    }
                  }
                >
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={true}
                    keyboardType="email-address"
                    maxLength={20}
                    onChangeText={[Function]}
                    placeholder="E.g. @jane123"
                    placeholderTextColor="#7F7F7F"
                    style={
                      {
                        "color": "#222222",
                        "flexGrow": 1,
                        "fontSize": 14,
                        "lineHeight": 20,
                        "minWidth": 96,
                        "padding": 0,
                      }
                    }
                    testID="input"
                  />
                </View>
              </View>
            </View>
            <View>
              <View>
                <Text
                  color="main"
                  fontSize={10}
                  fontWeight="medium"
                  horizontalTextAlign="left"
                  style={
                    [
                      {
                        "color": "#000000",
                        "fontFamily": "Rubik-Medium",
                        "fontSize": 10,
                        "textAlign": "left",
                        "textAlignVertical": "center",
                      },
                      {
                        "color": "#7F7F7F",
                        "letterSpacing": 1,
                        "lineHeight": 16,
                        "paddingBottom": 8,
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

  // A query nobody matches is also an answer, and must not read as "still loading" either.
  it('shows the empty state when the search matches nobody', async () => {
    const channelName = 'private-channel'
    const channelId = 'abc123'
    const userProfiles: Record<string, UserProfile> = {
      barbaz: await baseTypesFactory.create('UserProfile', {
        userId: 'barbaz',
        nickname: 'baz',
        channels: [],
        profilePhoto: undefined,
        photo: 'foobar',
      }),
    }
    const nonMembers: { [userId: string]: DmChannelUserData } = {}
    Object.entries(userProfiles).forEach(([userId, user]) => {
      nonMembers[userId] = { connected: true, user }
    })
    const rendered = renderComponent(
      <UpdateChannelMembership
        channelName={channelName}
        channelTitle={channelName}
        channelType={ChannelType.CHANNEL}
        channelIsPublic={false}
        channelId={channelId}
        community={undefined}
        nonMembers={nonMembers}
        handleBackButton={jest.fn()}
        updateChannelMembership={jest.fn()}
      />
    )

    expect(await findByTestId(rendered, `update-channel-membership-list-${channelId}`)).toBeDefined()

    fireEvent.changeText(await rendered.findByTestId('input'), 'qqqqqqqq')

    expect(await findByTestId(rendered, `update-channel-membership-list-nomembers-${channelId}`)).toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-spinner-${channelId}`)).not.toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-${channelId}`)).not.toBeDefined()
  })

  // The spinner still belongs to the case it names: the candidates have genuinely not arrived.
  it('spins only while the candidate list is undefined', async () => {
    const channelId = 'abc123'
    const rendered = renderComponent(
      <UpdateChannelMembershipList
        options={undefined}
        visibleOptionsIndices={undefined}
        setOptions={jest.fn()}
        channelId={channelId}
        nonMembers={{}}
      />
    )

    expect(await findByTestId(rendered, `update-channel-membership-list-spinner-${channelId}`)).toBeDefined()
    expect(await findByTestId(rendered, `update-channel-membership-list-nomembers-${channelId}`)).not.toBeDefined()
  })

  describe('picking members', () => {
    const channelName = 'private-channel'
    const channelId = 'abc123'
    const memberUserId = 'foobar'
    const nonMemberUserId = 'barbaz'

    const renderScreen = async () => {
      const userProfiles: Record<string, UserProfile> = {
        [memberUserId]: await baseTypesFactory.create('UserProfile', {
          userId: memberUserId,
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
      const nonMembers: { [userId: string]: DmChannelUserData } = {}
      Object.entries(userProfiles).forEach(([userId, userProfile]) => {
        nonMembers[userId] = { connected: true, user: userProfile }
      })
      return renderComponent(
        <UpdateChannelMembership
          channelName={channelName}
          channelTitle={channelName}
          channelType={ChannelType.CHANNEL}
          channelIsPublic={false}
          channelId={channelId}
          community={undefined}
          nonMembers={nonMembers}
          handleBackButton={jest.fn()}
          updateChannelMembership={jest.fn()}
        />
      )
    }

    const isChecked = (rendered: ReturnType<typeof render>, userId: string): boolean | undefined =>
      rendered.getByTestId(`update-channel-membership-list-item-${channelId}-${userId}`).props.accessibilityState
        ?.checked

    // The pills in the search box are the members picked so far (Figma PVQ1Kjf6Cq8ng1czuVtvR8,
    // 838:9308), so nothing is picked until the list is used.
    it('shows no pills before anything is picked', async () => {
      const rendered = await renderScreen()

      await findByTestId(rendered, `update-channel-membership-list-${channelId}`, true)
      expect(rendered.queryByTestId(`update-channel-membership-recipient-pill-${nonMemberUserId}`)).toBeNull()
      expect(rendered.queryByTestId(`update-channel-membership-recipient-pill-${memberUserId}`)).toBeNull()
    })

    it('adds a pill for a member picked from the list', async () => {
      const rendered = await renderScreen()

      fireEvent.press(await rendered.findByTestId(`update-channel-membership-list-row-${channelId}-${nonMemberUserId}`))

      expect(await findByTestId(rendered, `update-channel-membership-recipient-pill-${nonMemberUserId}`)).toBeDefined()
      expect(isChecked(rendered, nonMemberUserId)).toBe(true)
    })

    it('clears the list checkbox when the pill is removed', async () => {
      const rendered = await renderScreen()

      fireEvent.press(await rendered.findByTestId(`update-channel-membership-list-row-${channelId}-${nonMemberUserId}`))
      fireEvent.press(await rendered.findByTestId(`update-channel-membership-recipient-pill-${nonMemberUserId}`))

      expect(rendered.queryByTestId(`update-channel-membership-recipient-pill-${nonMemberUserId}`)).toBeNull()
      expect(isChecked(rendered, nonMemberUserId)).toBe(false)
    })

    // Members who already belong to the channel cannot be unpicked, so they get no pill.
    it('gives no pill to a member who is already in the channel', async () => {
      const rendered = await renderScreen()

      await findByTestId(rendered, `update-channel-membership-list-${channelId}`, true)
      expect(rendered.queryByTestId(`update-channel-membership-recipient-pill-${memberUserId}`)).toBeNull()
    })
  })

  // Reached from the channel menu rather than mid-creation, so the leading control is a close
  // cross, not a back arrow (838:9306).
  it('closes with a cross rather than a back arrow', async () => {
    const rendered = renderComponent(
      <UpdateChannelMembership
        channelName={'private-channel'}
        channelTitle={'private-channel'}
        channelType={ChannelType.CHANNEL}
        channelIsPublic={false}
        channelId={'abc123'}
        community={undefined}
        nonMembers={{}}
        handleBackButton={jest.fn()}
        updateChannelMembership={jest.fn()}
      />
    )

    const leading = await rendered.findByTestId('appbar_action_item')
    expect(within(leading).UNSAFE_getByType(Image).props.source.testUri).toContain('icon_close')
  })
})

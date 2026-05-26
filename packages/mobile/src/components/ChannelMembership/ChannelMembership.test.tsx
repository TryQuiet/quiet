import { getBaseTypesFactory, getSocketFactory } from '@quiet/state-manager'
import { UserProfile } from '@quiet/types'
import { render } from '@testing-library/react-native'
import { FactoryGirl } from 'factory-girl'
import React from 'react'
import { Provider } from 'react-redux'
import { ReactTestInstance } from 'react-test-renderer'
import { Store } from '../../store/store.types'
import { prepareStore } from '../../tests/utils/prepareStore'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { createLogger } from '../../utils/logger'
import { ChannelMembership } from './ChannelMembership.component'

const logger = createLogger('ChannelMembership:test')

describe('ChannelMembership component', () => {
  let factory: FactoryGirl
  let baseTypesFactory: FactoryGirl
  let store: Store

  beforeEach(async () => {
    factory = await getSocketFactory()
    baseTypesFactory = await getBaseTypesFactory()
    const preparedStore = await prepareStore()
    store = preparedStore.store
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

  it('displays spinner when no profiles loaded', async () => {
    const channelName = 'private-channel'
    const channelId = 'abc123'
    const rendered = renderComponent(
      <Provider store={store}>
        <ChannelMembership
          channelName={channelName}
          channelId={channelId}
          community={undefined}
          userProfiles={{}}
          members={undefined}
          memberCount={undefined}
          handleBackButton={jest.fn()}
        />
      </Provider>
    )

    expect(await findByTestId(rendered, `channel-membership-list-spinner-${channelId}`)).toBeDefined()
    expect(await findByTestId(rendered, `channel-membership-list-${channelId}`)).not.toBeDefined()
    expect(await findByTestId(rendered, `channel-membership-list-header-${channelId}`)).not.toBeDefined()
    expect(rendered.toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          {
            "backgroundColor": "#ffffff",
            "flex": 1,
          }
        }
        testID="channel-membership-component-abc123"
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
                    Members
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
            />
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
              style={
                {
                  "paddingVertical": 16,
                }
              }
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
                testID="channel-membership-list-spinner-abc123"
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
    `)
  })

  it('displays list of members when provided', async () => {
    const channelName = 'private-channel'
    const channelId = 'abc123'
    const userId = 'foobar'
    const userProfiles: Record<string, UserProfile> = {
      [userId]: await baseTypesFactory.create('UserProfile', {
        userId,
        nickname: 'foo',
        channels: [channelId],
        profilePhoto: undefined,
        photo: 'foobar',
      }),
    }
    const rendered = renderComponent(
      <Provider store={store}>
        <ChannelMembership
          channelName={channelName}
          channelId={channelId}
          community={undefined}
          userProfiles={userProfiles}
          members={[userProfiles[userId]]}
          memberCount={1}
          handleBackButton={jest.fn()}
        />
      </Provider>
    )

    expect(await findByTestId(rendered, `channel-membership-list-spinner-${channelId}`)).not.toBeDefined()
    expect(await findByTestId(rendered, `channel-membership-list-${channelId}`)).toBeDefined()
    expect(await findByTestId(rendered, `channel-membership-list-header-${channelId}`)).toBeDefined()
    expect(await findByTestId(rendered, `channel-membership-list-item-${channelId}-${userId}`)).toBeDefined()
    expect(rendered.toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          {
            "backgroundColor": "#ffffff",
            "flex": 1,
          }
        }
        testID="channel-membership-component-abc123"
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
                    Members
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
                  >
                    1
                  </Text>
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
            />
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
                      "lineHeight": 16,
                      "paddingHorizontal": 16,
                    },
                  ]
                }
                testID="channel-membership-list-header-abc123"
                verticalTextAlign="center"
              >
                MEMBERS
              </Text>
              <RCTScrollView
                ItemSeparatorComponent={[Function]}
                data={
                  [
                    {
                      "bio": "bio_1",
                      "channels": [
                        "abc123",
                      ],
                      "nickname": "foo",
                      "photo": "foobar",
                      "profilePhoto": undefined,
                      "userId": "foobar",
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
                testID="channel-membership-list-abc123"
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
                          "gap": 12,
                          "paddingHorizontal": 16,
                          "paddingVertical": 11,
                        }
                      }
                      testID="channel-membership-list-item-abc123-foobar"
                    >
                      <Image
                        alt="foo's profile image"
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
                        foo
                      </Text>
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
    `)
  })
})

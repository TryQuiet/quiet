import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { ChannelList } from './ChannelList.component'
import { ChannelTileProps } from '../ChannelTile/ChannelTile.types'

const searchTiles = (redirect: (id: string) => void): ChannelTileProps[] =>
  ['general', 'spam', 'design', 'qa', 'private-chat'].map(name => ({
    name,
    id: name,
    message: 'Text from latest chat message.',
    date: '1:55pm',
    unread: false,
    isPublic: name !== 'private-chat',
    redirect,
  }))

const renderChannelList = (redirect: (id: string) => void = jest.fn()) =>
  renderComponent(
    <ChannelList
      // @ts-ignore
      community={{ name: 'Quiet' }}
      tiles={searchTiles(redirect)}
      communityContextMenu={null}
    />
  )

describe('ChannelList component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <ChannelList
        // @ts-ignore
        community={{
          name: 'Quiet',
        }}
        tiles={[
          {
            name: 'general',
            id: 'general',
            message:
              'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
            date: '1:55pm',
            unread: false,
            isPublic: true,
            redirect: jest.fn(),
          },
          {
            name: 'spam',
            id: 'spam',
            message:
              'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
            date: '1:55pm',
            unread: false,
            isPublic: true,
            redirect: jest.fn(),
          },
          {
            name: 'design',
            id: 'design',
            message:
              'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
            date: '6/1/22',
            unread: true,
            isPublic: true,
            redirect: jest.fn(),
          },
          {
            name: 'qa',
            id: 'qa',
            message:
              'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
            date: 'Yesterday',
            unread: false,
            isPublic: true,
            redirect: jest.fn(),
          },
          {
            name: 'private-chat',
            id: 'private-chat',
            message:
              'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
            date: 'Yesterday',
            unread: false,
            isPublic: false,
            redirect: jest.fn(),
          },
        ]}
      />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          {
            "flex": 1,
          }
        }
        testID="channel-list-component"
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
                    qu
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
        <View
          style={
            {
              "backgroundColor": "#ffffff",
              "borderBottomColor": "#F0F0F0",
              "borderBottomWidth": 1,
              "paddingHorizontal": 16,
              "paddingVertical": 12,
            }
          }
        >
          <View
            testID="channel_search_input"
          >
            <View>
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
                round={true}
                style={
                  [
                    {
                      "backgroundColor": "#ffffff",
                      "borderColor": "#C4C4C4",
                      "borderRadius": 16,
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
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={true}
                  height={54}
                  keyboardType="default"
                  onChangeText={[Function]}
                  onContentSizeChange={[Function]}
                  placeholder="Search channels"
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
                  value=""
                />
              </View>
            </View>
          </View>
        </View>
        <RCTScrollView
          ItemSeparatorComponent={[Function]}
          ListEmptyComponent={
            <Typography
              color="gray50"
              fontSize={14}
              horizontalTextAlign="center"
              style={
                {
                  "padding": 24,
                }
              }
              testID="channels_list_empty"
            >
              No channels found
            </Typography>
          }
          data={
            [
              {
                "date": "1:55pm",
                "id": "general",
                "isPublic": true,
                "message": "Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.",
                "name": "general",
                "redirect": [MockFunction],
                "unread": false,
              },
              {
                "date": "1:55pm",
                "id": "spam",
                "isPublic": true,
                "message": "Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.",
                "name": "spam",
                "redirect": [MockFunction],
                "unread": false,
              },
              {
                "date": "6/1/22",
                "id": "design",
                "isPublic": true,
                "message": "Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.",
                "name": "design",
                "redirect": [MockFunction],
                "unread": true,
              },
              {
                "date": "Yesterday",
                "id": "qa",
                "isPublic": true,
                "message": "Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.",
                "name": "qa",
                "redirect": [MockFunction],
                "unread": false,
              },
              {
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
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
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
          testID="channels_list"
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
              <View
                style={
                  {
                    "backgroundColor": "#F0F0F0",
                    "height": 1,
                  }
                }
              />
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
                            S
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
                              spam
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
              <View
                style={
                  {
                    "backgroundColor": "#F0F0F0",
                    "height": 1,
                  }
                }
              />
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
                            D
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
                              design
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
                              6/1/22
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
              <View
                style={
                  {
                    "backgroundColor": "#F0F0F0",
                    "height": 1,
                  }
                }
              />
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
                            Q
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
                              qa
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
                              Yesterday
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
              <View
                style={
                  {
                    "backgroundColor": "#F0F0F0",
                    "height": 1,
                  }
                }
              />
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
                            P
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
                              private-chat
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
                              Yesterday
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
            </View>
          </View>
        </RCTScrollView>
      </View>
    `)
  })

  it('shows every channel while the search field is empty', () => {
    const { queryByTestId } = renderChannelList()

    for (const name of ['general', 'spam', 'design', 'qa', 'private-chat']) {
      expect(queryByTestId(`channel_tile_${name}`)).not.toBeNull()
    }
  })

  it('shows only the channels whose name contains the query, ignoring case and surrounding spaces', () => {
    const { getByPlaceholderText, queryByTestId } = renderChannelList()

    fireEvent.changeText(getByPlaceholderText('Search channels'), '  GEN  ')

    expect(queryByTestId('channel_tile_general')).not.toBeNull()
    for (const name of ['spam', 'design', 'qa', 'private-chat']) {
      expect(queryByTestId(`channel_tile_${name}`)).toBeNull()
    }
  })

  it('matches anywhere in the name, not only at the start', () => {
    const { getByPlaceholderText, queryByTestId } = renderChannelList()

    fireEvent.changeText(getByPlaceholderText('Search channels'), 'chat')

    expect(queryByTestId('channel_tile_private-chat')).not.toBeNull()
    expect(queryByTestId('channel_tile_general')).toBeNull()
  })

  it('shows an empty state when no channel matches the query', () => {
    const { getByPlaceholderText, queryByTestId, queryByText } = renderChannelList()

    fireEvent.changeText(getByPlaceholderText('Search channels'), 'zzz')

    expect(queryByText('No channels found')).not.toBeNull()
    for (const name of ['general', 'spam', 'design', 'qa', 'private-chat']) {
      expect(queryByTestId(`channel_tile_${name}`)).toBeNull()
    }
  })

  it('restores the full list when the query is cleared', () => {
    const { getByPlaceholderText, queryByTestId, queryByText } = renderChannelList()

    fireEvent.changeText(getByPlaceholderText('Search channels'), 'zzz')
    fireEvent.changeText(getByPlaceholderText('Search channels'), '')

    expect(queryByText('No channels found')).toBeNull()
    for (const name of ['general', 'spam', 'design', 'qa', 'private-chat']) {
      expect(queryByTestId(`channel_tile_${name}`)).not.toBeNull()
    }
  })

  it('still opens a channel when a search result is tapped', () => {
    const redirect = jest.fn()
    const { getByPlaceholderText, getByTestId } = renderChannelList(redirect)

    fireEvent.changeText(getByPlaceholderText('Search channels'), 'gen')
    fireEvent.press(getByTestId('channel_tile_general'))

    expect(redirect).toHaveBeenCalledWith('general')
  })
})

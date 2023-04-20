import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'

import { ContextMenu } from './ContextMenu.component'

import { ContextMenuItemProps } from './ContextMenu.types'

describe('ContextMenu component', () => {
  it('should match inline snapshot', () => {
    const items: ContextMenuItemProps[] = [
      {
        title: 'Create channel',
        action: () => {
          jest.fn()
        }
      },
      {
        title: 'Add members',
        action: () => {
          jest.fn()
        }
      },
      {
        title: 'Settings',
        action: () => {
          jest.fn()
        }
      }
    ]
    const { toJSON } = renderComponent(
      <ContextMenu visible={true} handleClose={jest.fn()} title={'Rockets'} items={items} />
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
            "display": "flex",
            "height": "100%",
            "position": "absolute",
            "width": "100%",
          }
        }
      >
        <View
          style={
            {
              "flex": 4,
            }
          }
        />
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
          focusable={false}
          onClick={[Function]}
          onResponderGrant={[Function]}
          onResponderMove={[Function]}
          onResponderRelease={[Function]}
          onResponderTerminate={[Function]}
          onResponderTerminationRequest={[Function]}
          onStartShouldSetResponder={[Function]}
          style={
            {
              "alignItems": "flex-start",
              "backgroundColor": "#ffffff",
              "borderTopLeftRadius": 8,
              "borderTopRightRadius": 8,
              "bottom": 0,
              "elevation": 12,
              "flex": 6,
              "flexDirection": "column",
              "shadowColor": "#000000",
              "shadowOffset": {
                "height": 7,
                "width": 0,
              },
              "shadowOpacity": 0.7,
              "shadowRadius": 7,
              "width": "100%",
            }
          }
          testID="context_menu_Rockets"
        >
          <View
            style={
              {
                "alignItems": "center",
                "display": "flex",
                "flexDirection": "row",
                "height": 60,
                "width": "100%",
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
                  "flex": 1,
                  "height": 60,
                  "justifyContent": "center",
                  "width": 60,
                }
              }
            >
              <Image
                resizeMethod="resize"
                resizeMode="cover"
                source={
                  {
                    "testUri": "../../../assets/icons/icon_close.png",
                  }
                }
                style={
                  {
                    "height": 13,
                    "width": 13,
                  }
                }
              />
            </View>
            <View
              style={
                {
                  "flex": 5,
                  "justifyContent": "center",
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
                    {
                      "alignSelf": "center",
                      "lineHeight": 26,
                    },
                  ]
                }
                verticalTextAlign="center"
              >
                Rockets
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
                "paddingBottom": 10,
                "width": "100%",
              }
            }
          >
            <RCTScrollView
              data={
                [
                  {
                    "action": [Function],
                    "title": "Create channel",
                  },
                  {
                    "action": [Function],
                    "title": "Add members",
                  },
                  {
                    "action": [Function],
                    "title": "Settings",
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
              scrollEventThrottle={50}
              showsVerticalScrollIndicator={false}
              stickyHeaderIndices={[]}
              style={
                {
                  "backgroundColor": "#ffffff",
                }
              }
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
                      [
                        {
                          "borderColor": "#F0F0F0",
                          "borderTopWidth": 1,
                        },
                        {
                          "borderBottomWidth": 0,
                        },
                      ]
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
                          "display": "flex",
                          "flexDirection": "row",
                          "height": 48,
                          "paddingLeft": 20,
                          "paddingRight": 20,
                          "width": "100%",
                        }
                      }
                      testID="Create channel"
                    >
                      <View
                        style={
                          {
                            "display": "flex",
                            "flex": 8,
                            "flexDirection": "row",
                            "justifyContent": "flex-start",
                          }
                        }
                      >
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
                                "lineHeight": 26,
                              },
                            ]
                          }
                          verticalTextAlign="center"
                        >
                          Create channel
                        </Text>
                      </View>
                      <View
                        style={
                          {
                            "display": "flex",
                            "flex": 1,
                            "flexDirection": "row",
                            "justifyContent": "flex-end",
                          }
                        }
                      >
                        <Image
                          resizeMethod="resize"
                          resizeMode="cover"
                          source={
                            {
                              "testUri": "../../../assets/icons/arrow_right_short.png",
                            }
                          }
                          style={
                            {
                              "height": 13,
                              "width": 8,
                            }
                          }
                        />
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
                      [
                        {
                          "borderColor": "#F0F0F0",
                          "borderTopWidth": 1,
                        },
                        {
                          "borderBottomWidth": 0,
                        },
                      ]
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
                          "display": "flex",
                          "flexDirection": "row",
                          "height": 48,
                          "paddingLeft": 20,
                          "paddingRight": 20,
                          "width": "100%",
                        }
                      }
                      testID="Add members"
                    >
                      <View
                        style={
                          {
                            "display": "flex",
                            "flex": 8,
                            "flexDirection": "row",
                            "justifyContent": "flex-start",
                          }
                        }
                      >
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
                                "lineHeight": 26,
                              },
                            ]
                          }
                          verticalTextAlign="center"
                        >
                          Add members
                        </Text>
                      </View>
                      <View
                        style={
                          {
                            "display": "flex",
                            "flex": 1,
                            "flexDirection": "row",
                            "justifyContent": "flex-end",
                          }
                        }
                      >
                        <Image
                          resizeMethod="resize"
                          resizeMode="cover"
                          source={
                            {
                              "testUri": "../../../assets/icons/arrow_right_short.png",
                            }
                          }
                          style={
                            {
                              "height": 13,
                              "width": 8,
                            }
                          }
                        />
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
                      [
                        {
                          "borderColor": "#F0F0F0",
                          "borderTopWidth": 1,
                        },
                        {
                          "borderBottomWidth": 1,
                        },
                      ]
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
                          "display": "flex",
                          "flexDirection": "row",
                          "height": 48,
                          "paddingLeft": 20,
                          "paddingRight": 20,
                          "width": "100%",
                        }
                      }
                      testID="Settings"
                    >
                      <View
                        style={
                          {
                            "display": "flex",
                            "flex": 8,
                            "flexDirection": "row",
                            "justifyContent": "flex-start",
                          }
                        }
                      >
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
                                "lineHeight": 26,
                              },
                            ]
                          }
                          verticalTextAlign="center"
                        >
                          Settings
                        </Text>
                      </View>
                      <View
                        style={
                          {
                            "display": "flex",
                            "flex": 1,
                            "flexDirection": "row",
                            "justifyContent": "flex-end",
                          }
                        }
                      >
                        <Image
                          resizeMethod="resize"
                          resizeMode="cover"
                          source={
                            {
                              "testUri": "../../../assets/icons/arrow_right_short.png",
                            }
                          }
                          style={
                            {
                              "height": 13,
                              "width": 8,
                            }
                          }
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </RCTScrollView>
          </View>
        </View>
      </View>
    `)
  })
})

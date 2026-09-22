import React from 'react'
import { Animated } from 'react-native'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { dragAway, hold, holdFor, holdSteadily, release } from '../../utils/functions/pressGestures/pressGestures'
import { TAP_FEEDBACK_DELAY_MS } from '../../utils/const/tapFeedback'

import { ContextMenu } from './ContextMenu.component'

import { ContextMenuItemProps } from './ContextMenu.types'

/**
 * A menu row is a `TouchableOpacity`, which dims by animating its opacity on
 * the native driver. That never writes the value back into the test tree, so
 * the dim is watched where it begins instead: the `Animated.timing` call whose
 * target is the row's active opacity.
 */
const ROW_ACTIVE_OPACITY = 0.2

const dimStarted = (timing: jest.SpyInstance) =>
  timing.mock.calls.some(call => (call[1] as { toValue?: number } | undefined)?.toValue === ROW_ACTIVE_OPACITY)

describe('ContextMenu component', () => {
  it('should match inline snapshot for visible menu', () => {
    const items: ContextMenuItemProps[] = [
      {
        title: 'Create channel',
        action: () => {
          jest.fn()
        },
      },
      {
        title: 'Add members',
        action: () => {
          jest.fn()
        },
      },
      {
        title: 'Settings',
        action: () => {
          jest.fn()
        },
      },
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
            "display": "flex",
            "height": "100%",
            "overflow": "hidden",
            "paddingTop": 10,
            "position": "absolute",
            "transform": [
              {
                "translateY": 0,
              },
            ],
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
              accessibilityLabel="Close menu"
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
              testID="context_menu_close"
            >
              <View
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
                      "testUri": "../../../src/assets/icons/png/icon_close.png",
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
            </View>
            <View
              style={
                {
                  "alignItems": "center",
                  "display": "flex",
                  "flex": 5,
                  "flexDirection": "row",
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
              scrollEventThrottle={0.0001}
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
                  <View>
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
                      testID="Create channel"
                    >
                      <View
                        style={
                          {
                            "alignItems": "center",
                            "display": "flex",
                            "flexDirection": "row",
                            "minHeight": 48,
                            "paddingLeft": 16,
                            "paddingRight": 16,
                            "paddingVertical": 11,
                            "width": "100%",
                          }
                        }
                        testID="context-menu-item"
                      >
                        <View
                          style={
                            {
                              "display": "flex",
                              "flex": 1,
                              "flexDirection": "row",
                              "justifyContent": "flex-start",
                            }
                          }
                        >
                          <View
                            style={
                              {
                                "display": "flex",
                                "flexDirection": "column",
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
                                    "color": undefined,
                                    "lineHeight": 26,
                                  },
                                ]
                              }
                              verticalTextAlign="center"
                            >
                              Create channel
                            </Text>
                          </View>
                        </View>
                        <View
                          style={
                            {
                              "alignItems": "center",
                              "display": "flex",
                              "flexDirection": "row",
                              "flexShrink": 0,
                              "gap": 8,
                              "justifyContent": "flex-end",
                            }
                          }
                        >
                          <Image
                            resizeMethod="resize"
                            resizeMode="cover"
                            source={
                              {
                                "testUri": "../../../src/assets/icons/png/arrow_right_short.png",
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
                    <View
                      style={
                        {
                          "backgroundColor": "#F0F0F0",
                          "height": 1,
                          "marginHorizontal": 16,
                        }
                      }
                    />
                  </View>
                </View>
                <View
                  onFocusCapture={[Function]}
                  onLayout={[Function]}
                  style={null}
                >
                  <View>
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
                      testID="Add members"
                    >
                      <View
                        style={
                          {
                            "alignItems": "center",
                            "display": "flex",
                            "flexDirection": "row",
                            "minHeight": 48,
                            "paddingLeft": 16,
                            "paddingRight": 16,
                            "paddingVertical": 11,
                            "width": "100%",
                          }
                        }
                        testID="context-menu-item"
                      >
                        <View
                          style={
                            {
                              "display": "flex",
                              "flex": 1,
                              "flexDirection": "row",
                              "justifyContent": "flex-start",
                            }
                          }
                        >
                          <View
                            style={
                              {
                                "display": "flex",
                                "flexDirection": "column",
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
                                    "color": undefined,
                                    "lineHeight": 26,
                                  },
                                ]
                              }
                              verticalTextAlign="center"
                            >
                              Add members
                            </Text>
                          </View>
                        </View>
                        <View
                          style={
                            {
                              "alignItems": "center",
                              "display": "flex",
                              "flexDirection": "row",
                              "flexShrink": 0,
                              "gap": 8,
                              "justifyContent": "flex-end",
                            }
                          }
                        >
                          <Image
                            resizeMethod="resize"
                            resizeMode="cover"
                            source={
                              {
                                "testUri": "../../../src/assets/icons/png/arrow_right_short.png",
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
                    <View
                      style={
                        {
                          "backgroundColor": "#F0F0F0",
                          "height": 1,
                          "marginHorizontal": 16,
                        }
                      }
                    />
                  </View>
                </View>
                <View
                  onFocusCapture={[Function]}
                  onLayout={[Function]}
                  style={null}
                >
                  <View>
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
                      testID="Settings"
                    >
                      <View
                        style={
                          {
                            "alignItems": "center",
                            "display": "flex",
                            "flexDirection": "row",
                            "minHeight": 48,
                            "paddingLeft": 16,
                            "paddingRight": 16,
                            "paddingVertical": 11,
                            "width": "100%",
                          }
                        }
                        testID="context-menu-item"
                      >
                        <View
                          style={
                            {
                              "display": "flex",
                              "flex": 1,
                              "flexDirection": "row",
                              "justifyContent": "flex-start",
                            }
                          }
                        >
                          <View
                            style={
                              {
                                "display": "flex",
                                "flexDirection": "column",
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
                                    "color": undefined,
                                    "lineHeight": 26,
                                  },
                                ]
                              }
                              verticalTextAlign="center"
                            >
                              Settings
                            </Text>
                          </View>
                        </View>
                        <View
                          style={
                            {
                              "alignItems": "center",
                              "display": "flex",
                              "flexDirection": "row",
                              "flexShrink": 0,
                              "gap": 8,
                              "justifyContent": "flex-end",
                            }
                          }
                        >
                          <Image
                            resizeMethod="resize"
                            resizeMode="cover"
                            source={
                              {
                                "testUri": "../../../src/assets/icons/png/arrow_right_short.png",
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
                    <View
                      style={
                        {
                          "backgroundColor": "#F0F0F0",
                          "height": 1,
                          "marginHorizontal": 16,
                        }
                      }
                    />
                  </View>
                </View>
              </View>
            </RCTScrollView>
          </View>
        </View>
      </View>
    `)
  })

  it('should match inline snapshot for closed menu', () => {
    const items: ContextMenuItemProps[] = [
      {
        title: 'Create channel',
        action: () => {
          jest.fn()
        },
      },
      {
        title: 'Add members',
        action: () => {
          jest.fn()
        },
      },
      {
        title: 'Settings',
        action: () => {
          jest.fn()
        },
      },
    ]
    const { toJSON } = renderComponent(
      <ContextMenu visible={false} handleClose={jest.fn()} title={'Rockets'} items={items} />
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
            "display": "none",
            "height": "100%",
            "overflow": "hidden",
            "paddingTop": 10,
            "position": "absolute",
            "transform": [
              {
                "translateY": 0,
              },
            ],
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
              accessibilityLabel="Close menu"
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
              testID="context_menu_close"
            >
              <View
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
                      "testUri": "../../../src/assets/icons/png/icon_close.png",
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
            </View>
            <View
              style={
                {
                  "alignItems": "center",
                  "display": "flex",
                  "flex": 5,
                  "flexDirection": "row",
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
              scrollEventThrottle={0.0001}
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
                  <View>
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
                      testID="Create channel"
                    >
                      <View
                        style={
                          {
                            "alignItems": "center",
                            "display": "flex",
                            "flexDirection": "row",
                            "minHeight": 48,
                            "paddingLeft": 16,
                            "paddingRight": 16,
                            "paddingVertical": 11,
                            "width": "100%",
                          }
                        }
                        testID="context-menu-item"
                      >
                        <View
                          style={
                            {
                              "display": "flex",
                              "flex": 1,
                              "flexDirection": "row",
                              "justifyContent": "flex-start",
                            }
                          }
                        >
                          <View
                            style={
                              {
                                "display": "flex",
                                "flexDirection": "column",
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
                                    "color": undefined,
                                    "lineHeight": 26,
                                  },
                                ]
                              }
                              verticalTextAlign="center"
                            >
                              Create channel
                            </Text>
                          </View>
                        </View>
                        <View
                          style={
                            {
                              "alignItems": "center",
                              "display": "flex",
                              "flexDirection": "row",
                              "flexShrink": 0,
                              "gap": 8,
                              "justifyContent": "flex-end",
                            }
                          }
                        >
                          <Image
                            resizeMethod="resize"
                            resizeMode="cover"
                            source={
                              {
                                "testUri": "../../../src/assets/icons/png/arrow_right_short.png",
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
                    <View
                      style={
                        {
                          "backgroundColor": "#F0F0F0",
                          "height": 1,
                          "marginHorizontal": 16,
                        }
                      }
                    />
                  </View>
                </View>
                <View
                  onFocusCapture={[Function]}
                  onLayout={[Function]}
                  style={null}
                >
                  <View>
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
                      testID="Add members"
                    >
                      <View
                        style={
                          {
                            "alignItems": "center",
                            "display": "flex",
                            "flexDirection": "row",
                            "minHeight": 48,
                            "paddingLeft": 16,
                            "paddingRight": 16,
                            "paddingVertical": 11,
                            "width": "100%",
                          }
                        }
                        testID="context-menu-item"
                      >
                        <View
                          style={
                            {
                              "display": "flex",
                              "flex": 1,
                              "flexDirection": "row",
                              "justifyContent": "flex-start",
                            }
                          }
                        >
                          <View
                            style={
                              {
                                "display": "flex",
                                "flexDirection": "column",
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
                                    "color": undefined,
                                    "lineHeight": 26,
                                  },
                                ]
                              }
                              verticalTextAlign="center"
                            >
                              Add members
                            </Text>
                          </View>
                        </View>
                        <View
                          style={
                            {
                              "alignItems": "center",
                              "display": "flex",
                              "flexDirection": "row",
                              "flexShrink": 0,
                              "gap": 8,
                              "justifyContent": "flex-end",
                            }
                          }
                        >
                          <Image
                            resizeMethod="resize"
                            resizeMode="cover"
                            source={
                              {
                                "testUri": "../../../src/assets/icons/png/arrow_right_short.png",
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
                    <View
                      style={
                        {
                          "backgroundColor": "#F0F0F0",
                          "height": 1,
                          "marginHorizontal": 16,
                        }
                      }
                    />
                  </View>
                </View>
                <View
                  onFocusCapture={[Function]}
                  onLayout={[Function]}
                  style={null}
                >
                  <View>
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
                      testID="Settings"
                    >
                      <View
                        style={
                          {
                            "alignItems": "center",
                            "display": "flex",
                            "flexDirection": "row",
                            "minHeight": 48,
                            "paddingLeft": 16,
                            "paddingRight": 16,
                            "paddingVertical": 11,
                            "width": "100%",
                          }
                        }
                        testID="context-menu-item"
                      >
                        <View
                          style={
                            {
                              "display": "flex",
                              "flex": 1,
                              "flexDirection": "row",
                              "justifyContent": "flex-start",
                            }
                          }
                        >
                          <View
                            style={
                              {
                                "display": "flex",
                                "flexDirection": "column",
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
                                    "color": undefined,
                                    "lineHeight": 26,
                                  },
                                ]
                              }
                              verticalTextAlign="center"
                            >
                              Settings
                            </Text>
                          </View>
                        </View>
                        <View
                          style={
                            {
                              "alignItems": "center",
                              "display": "flex",
                              "flexDirection": "row",
                              "flexShrink": 0,
                              "gap": 8,
                              "justifyContent": "flex-end",
                            }
                          }
                        >
                          <Image
                            resizeMethod="resize"
                            resizeMode="cover"
                            source={
                              {
                                "testUri": "../../../src/assets/icons/png/arrow_right_short.png",
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
                    <View
                      style={
                        {
                          "backgroundColor": "#F0F0F0",
                          "height": 1,
                          "marginHorizontal": 16,
                        }
                      }
                    />
                  </View>
                </View>
              </View>
            </RCTScrollView>
          </View>
        </View>
      </View>
    `)
  })

  // #1495: the rows are a FlatList, so the row you start a flick on used to dim
  // under your finger before the list had a chance to take the touch over.
  describe('a row that a flick starts on', () => {
    const action = jest.fn()
    const renderMenu = () =>
      renderComponent(
        <ContextMenu
          visible={true}
          handleClose={jest.fn()}
          title={'Rockets'}
          items={[{ title: 'Settings', action } as ContextMenuItemProps]}
        />
      )

    let timing: jest.SpyInstance

    beforeEach(() => {
      jest.useFakeTimers()
      action.mockClear()
      timing = jest.spyOn(Animated, 'timing')
    })

    afterEach(() => {
      timing.mockRestore()
      jest.useRealTimers()
    })

    it('stays undimmed while the touch could still turn into a scroll', () => {
      const { getByTestId } = renderMenu()
      const row = getByTestId('Settings')
      timing.mockClear()

      hold(row)
      holdFor(TAP_FEEDBACK_DELAY_MS - 1)
      expect(dimStarted(timing)).toBe(false)

      holdFor(1)
      expect(dimStarted(timing)).toBe(true)
    })

    it('never dims when the list takes the touch over', () => {
      const { getByTestId } = renderMenu()
      const row = getByTestId('Settings')
      timing.mockClear()

      hold(row)
      holdFor(TAP_FEEDBACK_DELAY_MS - 1)
      dragAway(row)
      expect(dimStarted(timing)).toBe(false)
    })

    // The delay must not swallow a real tap.
    it('still runs its action when the tap is released inside the delay', () => {
      const { getByTestId } = renderMenu()
      const row = getByTestId('Settings')

      hold(row)
      holdFor(TAP_FEEDBACK_DELAY_MS - 1)
      release(row)
      expect(action).toHaveBeenCalled()
    })

    it('dims a deliberate press, which is what the feedback is for', () => {
      const { getByTestId } = renderMenu()
      const row = getByTestId('Settings')
      timing.mockClear()

      holdSteadily(row)
      expect(dimStarted(timing)).toBe(true)
    })
  })
})

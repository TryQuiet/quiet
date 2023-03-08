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
        style={
          Object {
            "alignItems": "flex-start",
            "backgroundColor": "#ffffff",
            "borderTopLeftRadius": 8,
            "borderTopRightRadius": 8,
            "bottom": 0,
            "display": "flex",
            "flexDirection": "column",
            "height": 420,
            "position": "absolute",
            "width": "100%",
          }
        }
      >
        <View
          style={
            Object {
              "alignItems": "center",
              "display": "flex",
              "flexDirection": "row",
              "height": 60,
              "padding": 20,
              "width": "100%",
            }
          }
        >
          <View
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
              Object {
                "flex": 1,
                "justifyContent": "center",
              }
            }
          >
            <Image
              resizeMethod="resize"
              resizeMode="cover"
              source={
                Object {
                  "testUri": "../../../assets/icons/icon_close.png",
                }
              }
              style={
                Object {
                  "height": 13,
                  "width": 13,
                }
              }
            />
          </View>
          <View
            style={
              Object {
                "flex": 4,
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
                Array [
                  Object {
                    "color": "#000000",
                    "fontFamily": "Rubik-Medium",
                    "fontSize": 16,
                    "textAlign": "left",
                    "textAlignVertical": "center",
                  },
                  Object {
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
              Object {
                "flex": 1,
              }
            }
          />
        </View>
        <View
          style={
            Object {
              "paddingBottom": 10,
              "width": "100%",
            }
          }
        >
          <RCTScrollView
            data={
              Array [
                Object {
                  "action": [Function],
                  "title": "Create channel",
                },
                Object {
                  "action": [Function],
                  "title": "Add members",
                },
                Object {
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
            stickyHeaderIndices={Array []}
            style={
              Object {
                "backgroundColor": "#ffffff",
              }
            }
            viewabilityConfigCallbackPairs={Array []}
          >
            <View>
              <View
                onLayout={[Function]}
                style={null}
              >
                <View
                  style={
                    Array [
                      Object {
                        "borderColor": "#F0F0F0",
                        "borderTopWidth": 1,
                      },
                      Object {
                        "borderBottomWidth": 0,
                      },
                    ]
                  }
                >
                  <View
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
                      Object {
                        "alignItems": "center",
                        "display": "flex",
                        "flexDirection": "row",
                        "height": 48,
                        "paddingLeft": 20,
                        "paddingRight": 20,
                        "width": "100%",
                      }
                    }
                  >
                    <View
                      style={
                        Object {
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
                          Array [
                            Object {
                              "color": "#000000",
                              "fontFamily": "Rubik-Regular",
                              "fontSize": 16,
                              "textAlign": "left",
                              "textAlignVertical": "center",
                            },
                            Object {
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
                        Object {
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
                          Object {
                            "testUri": "../../../assets/icons/arrow_right_short.png",
                          }
                        }
                        style={
                          Object {
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
                onLayout={[Function]}
                style={null}
              >
                <View
                  style={
                    Array [
                      Object {
                        "borderColor": "#F0F0F0",
                        "borderTopWidth": 1,
                      },
                      Object {
                        "borderBottomWidth": 0,
                      },
                    ]
                  }
                >
                  <View
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
                      Object {
                        "alignItems": "center",
                        "display": "flex",
                        "flexDirection": "row",
                        "height": 48,
                        "paddingLeft": 20,
                        "paddingRight": 20,
                        "width": "100%",
                      }
                    }
                  >
                    <View
                      style={
                        Object {
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
                          Array [
                            Object {
                              "color": "#000000",
                              "fontFamily": "Rubik-Regular",
                              "fontSize": 16,
                              "textAlign": "left",
                              "textAlignVertical": "center",
                            },
                            Object {
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
                        Object {
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
                          Object {
                            "testUri": "../../../assets/icons/arrow_right_short.png",
                          }
                        }
                        style={
                          Object {
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
                onLayout={[Function]}
                style={null}
              >
                <View
                  style={
                    Array [
                      Object {
                        "borderColor": "#F0F0F0",
                        "borderTopWidth": 1,
                      },
                      Object {
                        "borderBottomWidth": 1,
                      },
                    ]
                  }
                >
                  <View
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
                      Object {
                        "alignItems": "center",
                        "display": "flex",
                        "flexDirection": "row",
                        "height": 48,
                        "paddingLeft": 20,
                        "paddingRight": 20,
                        "width": "100%",
                      }
                    }
                  >
                    <View
                      style={
                        Object {
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
                          Array [
                            Object {
                              "color": "#000000",
                              "fontFamily": "Rubik-Regular",
                              "fontSize": 16,
                              "textAlign": "left",
                              "textAlignVertical": "center",
                            },
                            Object {
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
                        Object {
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
                          Object {
                            "testUri": "../../../assets/icons/arrow_right_short.png",
                          }
                        }
                        style={
                          Object {
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
    `)
  })
})

import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { ChannelList } from './ChannelList.component'

describe('ChannelList component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <ChannelList
        // @ts-ignore
        community={{
          name: 'Quiet'
        }}
        tiles={[
          {
            name: 'general',
            address: 'general',
            message:
              'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
            date: '1:55pm',
            unread: false,
            redirect: jest.fn()
          },
          {
            name: 'spam',
            address: 'spam',
            message:
              'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
            date: '1:55pm',
            unread: false,
            redirect: jest.fn()
          },
          {
            name: 'design',
            address: 'design',
            message:
              'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
            date: '6/1/22',
            unread: true,
            redirect: jest.fn()
          },
          {
            name: 'qa',
            address: 'design',
            message:
              'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
            date: 'Yesterday',
            unread: false,
            redirect: jest.fn()
          }
        ]}
      />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          Object {
            "flex": 1,
          }
        }
      >
        <View
          style={
            Array [
              Object {
                "backgroundColor": "#ffffff",
                "borderBottomColor": "#F0F0F0",
                "borderBottomWidth": 1,
                "flexDirection": "row",
                "flexGrow": 1,
                "maxHeight": 52,
                "minHeight": 52,
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
                "justifyContent": "center",
                "width": 64,
              }
            }
          >
            <View
              style={
                Object {
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
                  Array [
                    Object {
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
          <View
            style={
              Object {
                "alignItems": "flex-start",
                "flexGrow": 1,
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
                ]
              }
              verticalTextAlign="center"
            >
              Quiet
            </Text>
          </View>
          <View
            style={
              Object {
                "width": 64,
              }
            }
          />
        </View>
        <RCTScrollView
          data={
            Array [
              Object {
                "address": "general",
                "date": "1:55pm",
                "message": "Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.",
                "name": "general",
                "redirect": [MockFunction],
                "unread": false,
              },
              Object {
                "address": "spam",
                "date": "1:55pm",
                "message": "Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.",
                "name": "spam",
                "redirect": [MockFunction],
                "unread": false,
              },
              Object {
                "address": "design",
                "date": "6/1/22",
                "message": "Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.",
                "name": "design",
                "redirect": [MockFunction],
                "unread": true,
              },
              Object {
                "address": "design",
                "date": "Yesterday",
                "message": "Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.",
                "name": "qa",
                "redirect": [MockFunction],
                "unread": false,
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
                    "borderBottomColor": "#F0F0F0",
                    "borderBottomWidth": 1,
                    "padding": 16,
                  }
                }
              >
                <View
                  style={
                    Object {
                      "flexDirection": "row",
                    }
                  }
                >
                  <View
                    style={
                      Object {
                        "alignItems": "center",
                        "flex": 1,
                        "paddingRight": 12,
                      }
                    }
                  >
                    <View
                      style={
                        Object {
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
                        fontSize={14}
                        horizontalTextAlign="left"
                        style={
                          Array [
                            Object {
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
                        ge
                      </Text>
                    </View>
                  </View>
                  <View
                    style={
                      Object {
                        "flex": 9,
                        "flexDirection": "column",
                      }
                    }
                  >
                    <View
                      style={
                        Object {
                          "flexDirection": "row",
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flex": 8,
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
                            ]
                          }
                          verticalTextAlign="center"
                        >
                          #
                          general
                        </Text>
                      </View>
                      <View
                        style={
                          Object {
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
                            Array [
                              Object {
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
                        Object {
                          "flexDirection": "row",
                          "paddingTop": 3,
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flex": 10,
                          }
                        }
                      >
                        <Text
                          color="gray50"
                          fontSize={14}
                          horizontalTextAlign="left"
                          style={
                            Array [
                              Object {
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
                          Object {
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
            <View
              onLayout={[Function]}
              style={null}
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
                    "borderBottomColor": "#F0F0F0",
                    "borderBottomWidth": 1,
                    "padding": 16,
                  }
                }
              >
                <View
                  style={
                    Object {
                      "flexDirection": "row",
                    }
                  }
                >
                  <View
                    style={
                      Object {
                        "alignItems": "center",
                        "flex": 1,
                        "paddingRight": 12,
                      }
                    }
                  >
                    <View
                      style={
                        Object {
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
                        fontSize={14}
                        horizontalTextAlign="left"
                        style={
                          Array [
                            Object {
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
                        sp
                      </Text>
                    </View>
                  </View>
                  <View
                    style={
                      Object {
                        "flex": 9,
                        "flexDirection": "column",
                      }
                    }
                  >
                    <View
                      style={
                        Object {
                          "flexDirection": "row",
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flex": 8,
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
                            ]
                          }
                          verticalTextAlign="center"
                        >
                          #
                          spam
                        </Text>
                      </View>
                      <View
                        style={
                          Object {
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
                            Array [
                              Object {
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
                        Object {
                          "flexDirection": "row",
                          "paddingTop": 3,
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flex": 10,
                          }
                        }
                      >
                        <Text
                          color="gray50"
                          fontSize={14}
                          horizontalTextAlign="left"
                          style={
                            Array [
                              Object {
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
                          Object {
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
            <View
              onLayout={[Function]}
              style={null}
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
                    "borderBottomColor": "#F0F0F0",
                    "borderBottomWidth": 1,
                    "padding": 16,
                  }
                }
              >
                <View
                  style={
                    Object {
                      "flexDirection": "row",
                    }
                  }
                >
                  <View
                    style={
                      Object {
                        "alignItems": "center",
                        "flex": 1,
                        "paddingRight": 12,
                      }
                    }
                  >
                    <View
                      style={
                        Object {
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
                        fontSize={14}
                        horizontalTextAlign="left"
                        style={
                          Array [
                            Object {
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
                        de
                      </Text>
                    </View>
                  </View>
                  <View
                    style={
                      Object {
                        "flex": 9,
                        "flexDirection": "column",
                      }
                    }
                  >
                    <View
                      style={
                        Object {
                          "flexDirection": "row",
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flex": 8,
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
                            ]
                          }
                          verticalTextAlign="center"
                        >
                          #
                          design
                        </Text>
                      </View>
                      <View
                        style={
                          Object {
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
                            Array [
                              Object {
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
                        Object {
                          "flexDirection": "row",
                          "paddingTop": 3,
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flex": 10,
                          }
                        }
                      >
                        <Text
                          color="gray50"
                          fontSize={14}
                          horizontalTextAlign="left"
                          style={
                            Array [
                              Object {
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
                          Object {
                            "alignItems": "flex-end",
                            "flex": 2,
                          }
                        }
                      >
                        <View
                          style={
                            Object {
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
                              Array [
                                Object {
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
            <View
              onLayout={[Function]}
              style={null}
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
                    "borderBottomColor": "#F0F0F0",
                    "borderBottomWidth": 1,
                    "padding": 16,
                  }
                }
              >
                <View
                  style={
                    Object {
                      "flexDirection": "row",
                    }
                  }
                >
                  <View
                    style={
                      Object {
                        "alignItems": "center",
                        "flex": 1,
                        "paddingRight": 12,
                      }
                    }
                  >
                    <View
                      style={
                        Object {
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
                        fontSize={14}
                        horizontalTextAlign="left"
                        style={
                          Array [
                            Object {
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
                        qa
                      </Text>
                    </View>
                  </View>
                  <View
                    style={
                      Object {
                        "flex": 9,
                        "flexDirection": "column",
                      }
                    }
                  >
                    <View
                      style={
                        Object {
                          "flexDirection": "row",
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flex": 8,
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
                            ]
                          }
                          verticalTextAlign="center"
                        >
                          #
                          qa
                        </Text>
                      </View>
                      <View
                        style={
                          Object {
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
                            Array [
                              Object {
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
                        Object {
                          "flexDirection": "row",
                          "paddingTop": 3,
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flex": 10,
                          }
                        }
                      >
                        <Text
                          color="gray50"
                          fontSize={14}
                          horizontalTextAlign="left"
                          style={
                            Array [
                              Object {
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
                          Object {
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
        </RCTScrollView>
      </View>
    `)
  })
})

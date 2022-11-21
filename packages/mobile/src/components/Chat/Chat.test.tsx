import React from 'react'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Chat } from './Chat.component'
import { Keyboard } from 'react-native'

jest.useFakeTimers()

jest.mock('react-native-jdenticon', () => {
  const mockJdenticon = () => {
    return null
  }
  return mockJdenticon
})

describe('Chat component', () => {
  jest
    .spyOn(Keyboard, 'addListener')
    // @ts-expect-error
    .mockImplementation(() => ({ remove: jest.fn() }))

  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <Chat
        sendMessageAction={jest.fn()}
        loadMessagesAction={jest.fn()}
        handleBackButton={jest.fn()}
        channel={{
          name: 'Zbay',
          description: '',
          owner: '',
          timestamp: 0,
          address: ''
        }}
        pendingMessages={{}}
        messages={{
          count: 16,
          groups: {
            '28 Oct': [
              [
                {
                  id: '1',
                  type: 1,
                  message: 'Hello',
                  createdAt: 0,
                  date: '28 Oct, 10:00',
                  nickname: 'alice'
                },
                {
                  id: '2',
                  type: 1,
                  message:
                    "How are you? My day was awesome. I removed a lot of unused props from container and I simplified code a lot. I like coding, coding is like building things with LEGO. I could admit it's a little bit harder and there's a lot that can go wrong but I like it anyway.",
                  createdAt: 0,
                  date: '28 Oct, 10:01',
                  nickname: 'alice'
                }
              ],
              [
                {
                  id: '3',
                  type: 1,
                  message: 'Great, thanks!',
                  createdAt: 0,
                  date: '28 Oct, 10:02',
                  nickname: 'john'
                }
              ]
            ],
            Today: [
              [
                {
                  id: '4',
                  type: 1,
                  message: 'Luck, I am your father!',
                  createdAt: 0,
                  date: '12:40',
                  nickname: 'chad'
                },
                {
                  id: '5',
                  type: 1,
                  message: "That's impossible!",
                  createdAt: 0,
                  date: '12:41',
                  nickname: 'chad'
                },
                {
                  id: '6',
                  type: 1,
                  message: 'Nooo!',
                  createdAt: 0,
                  date: '12:45',
                  nickname: 'chad'
                }
              ],
              [
                {
                  id: '7',
                  type: 1,
                  message: 'Uhuhu!',
                  createdAt: 0,
                  date: '12:46',
                  nickname: 'anakin'
                }
              ],
              [
                {
                  id: '8',
                  type: 1,
                  message: 'Why?',
                  createdAt: 0,
                  date: '12:46',
                  nickname: 'anakin'
                }
              ],
              [
                {
                  id: '9',
                  type: 1,
                  message: 'Messages more there should be',
                  createdAt: 0,
                  date: '12:46',
                  nickname: 'yoda'
                }
              ],
              [
                {
                  id: '11',
                  type: 1,
                  message: 'I Agree',
                  createdAt: 0,
                  date: '12:46',
                  nickname: 'obi'
                },
                {
                  id: '12',
                  type: 1,
                  message: 'Of course, I Agree',
                  createdAt: 0,
                  date: '12:46',
                  nickname: 'obi'
                }
              ],
              [
                {
                  id: '13',
                  type: 1,
                  message: 'Wrough!',
                  createdAt: 0,
                  date: '12:46',
                  nickname: 'wookie'
                }
              ],
              [
                {
                  id: '14',
                  type: 1,
                  message: 'Yeah!',
                  createdAt: 0,
                  date: '12:46',
                  nickname: 'leah'
                }
              ],
              [
                {
                  id: '15',
                  type: 1,
                  message: 'The more messages the better',
                  createdAt: 0,
                  date: '12:46',
                  nickname: 'luke'
                }
              ],
              [
                {
                  id: '16',
                  type: 1,
                  message: 'We cannot grant you the rank of messager',
                  createdAt: 0,
                  date: '12:46',
                  nickname: 'windoo'
                }
              ],
              [
                {
                  id: '17',
                  type: 1,
                  message:
                    'deathhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhstarrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrdeathstartttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
                  createdAt: 0,
                  date: '12:46',
                  nickname: 'vader'
                }
              ]
            ]
          }
        }}
        user={'holmes'}
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
            <Image
              resizeMethod="resize"
              resizeMode="cover"
              source={
                Object {
                  "testUri": "../../../assets/icons/arrow_left.png",
                }
              }
              style={
                Object {
                  "height": 16,
                  "width": 16,
                }
              }
            />
          </View>
          <View
            style={
              Object {
                "alignItems": "center",
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
              #Zbay
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
        <View
          onLayout={[Function]}
          style={
            Array [
              Object {
                "backgroundColor": "white",
                "flex": 1,
                "flexDirection": "column",
                "justifyContent": "flex-end",
                "paddingBottom": 20,
              },
              Object {
                "paddingBottom": 0,
              },
            ]
          }
        >
          <RCTScrollView
            data={
              Array [
                "Today",
                "28 Oct",
              ]
            }
            getItem={[Function]}
            getItemCount={[Function]}
            keyExtractor={[Function]}
            onContentSizeChange={[Function]}
            onEndReached={[Function]}
            onEndReachedThreshold={0.7}
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
                "paddingLeft": 20,
                "paddingRight": 20,
                "transform": Array [
                  Object {
                    "rotate": "180deg",
                  },
                ],
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
                    Object {
                      "transform": Array [
                        Object {
                          "rotate": "180deg",
                        },
                      ],
                    }
                  }
                >
                  <View>
                    <View
                      style={
                        Object {
                          "flex": 1,
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flexDirection": "row",
                            "paddingBottom": 30,
                          }
                        }
                      >
                        <View
                          style={
                            Object {
                              "alignItems": "center",
                              "flex": 1,
                              "paddingRight": 15,
                            }
                          }
                        />
                        <View
                          style={
                            Object {
                              "flex": 8,
                            }
                          }
                        >
                          <View
                            style={
                              Object {
                                "flexDirection": "row",
                                "paddingBottom": 3,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
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
                                chad
                              </Text>
                            </View>
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
                                  "paddingLeft": 8,
                                  "paddingTop": 2,
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
                                12:40
                              </Text>
                            </View>
                          </View>
                          <View
                            style={
                              Object {
                                "flexShrink": 1,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "paddingTop": 0,
                                }
                              }
                            >
                              <Text
                                color="main"
                                fontSize={14}
                                horizontalTextAlign="left"
                                style={
                                  Array [
                                    Object {
                                      "color": "#000000",
                                      "fontFamily": "Rubik-Regular",
                                      "fontSize": 14,
                                      "textAlign": "left",
                                      "textAlignVertical": "center",
                                    },
                                  ]
                                }
                                verticalTextAlign="center"
                              >
                                Luck, I am your father!
                              </Text>
                            </View>
                            <View
                              style={
                                Object {
                                  "paddingTop": 4,
                                }
                              }
                            >
                              <Text
                                color="main"
                                fontSize={14}
                                horizontalTextAlign="left"
                                style={
                                  Array [
                                    Object {
                                      "color": "#000000",
                                      "fontFamily": "Rubik-Regular",
                                      "fontSize": 14,
                                      "textAlign": "left",
                                      "textAlignVertical": "center",
                                    },
                                  ]
                                }
                                verticalTextAlign="center"
                              >
                                That's impossible!
                              </Text>
                            </View>
                            <View
                              style={
                                Object {
                                  "paddingTop": 4,
                                }
                              }
                            >
                              <Text
                                color="main"
                                fontSize={14}
                                horizontalTextAlign="left"
                                style={
                                  Array [
                                    Object {
                                      "color": "#000000",
                                      "fontFamily": "Rubik-Regular",
                                      "fontSize": 14,
                                      "textAlign": "left",
                                      "textAlignVertical": "center",
                                    },
                                  ]
                                }
                                verticalTextAlign="center"
                              >
                                Nooo!
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View
                      style={
                        Object {
                          "flex": 1,
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flexDirection": "row",
                            "paddingBottom": 30,
                          }
                        }
                      >
                        <View
                          style={
                            Object {
                              "alignItems": "center",
                              "flex": 1,
                              "paddingRight": 15,
                            }
                          }
                        />
                        <View
                          style={
                            Object {
                              "flex": 8,
                            }
                          }
                        >
                          <View
                            style={
                              Object {
                                "flexDirection": "row",
                                "paddingBottom": 3,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
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
                                anakin
                              </Text>
                            </View>
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
                                  "paddingLeft": 8,
                                  "paddingTop": 2,
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
                                12:46
                              </Text>
                            </View>
                          </View>
                          <View
                            style={
                              Object {
                                "flexShrink": 1,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "paddingTop": 0,
                                }
                              }
                            >
                              <Text
                                color="main"
                                fontSize={14}
                                horizontalTextAlign="left"
                                style={
                                  Array [
                                    Object {
                                      "color": "#000000",
                                      "fontFamily": "Rubik-Regular",
                                      "fontSize": 14,
                                      "textAlign": "left",
                                      "textAlignVertical": "center",
                                    },
                                  ]
                                }
                                verticalTextAlign="center"
                              >
                                Uhuhu!
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View
                      style={
                        Object {
                          "flex": 1,
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flexDirection": "row",
                            "paddingBottom": 30,
                          }
                        }
                      >
                        <View
                          style={
                            Object {
                              "alignItems": "center",
                              "flex": 1,
                              "paddingRight": 15,
                            }
                          }
                        />
                        <View
                          style={
                            Object {
                              "flex": 8,
                            }
                          }
                        >
                          <View
                            style={
                              Object {
                                "flexDirection": "row",
                                "paddingBottom": 3,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
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
                                anakin
                              </Text>
                            </View>
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
                                  "paddingLeft": 8,
                                  "paddingTop": 2,
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
                                12:46
                              </Text>
                            </View>
                          </View>
                          <View
                            style={
                              Object {
                                "flexShrink": 1,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "paddingTop": 0,
                                }
                              }
                            >
                              <Text
                                color="main"
                                fontSize={14}
                                horizontalTextAlign="left"
                                style={
                                  Array [
                                    Object {
                                      "color": "#000000",
                                      "fontFamily": "Rubik-Regular",
                                      "fontSize": 14,
                                      "textAlign": "left",
                                      "textAlignVertical": "center",
                                    },
                                  ]
                                }
                                verticalTextAlign="center"
                              >
                                Why?
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View
                      style={
                        Object {
                          "flex": 1,
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flexDirection": "row",
                            "paddingBottom": 30,
                          }
                        }
                      >
                        <View
                          style={
                            Object {
                              "alignItems": "center",
                              "flex": 1,
                              "paddingRight": 15,
                            }
                          }
                        />
                        <View
                          style={
                            Object {
                              "flex": 8,
                            }
                          }
                        >
                          <View
                            style={
                              Object {
                                "flexDirection": "row",
                                "paddingBottom": 3,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
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
                                yoda
                              </Text>
                            </View>
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
                                  "paddingLeft": 8,
                                  "paddingTop": 2,
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
                                12:46
                              </Text>
                            </View>
                          </View>
                          <View
                            style={
                              Object {
                                "flexShrink": 1,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "paddingTop": 0,
                                }
                              }
                            >
                              <Text
                                color="main"
                                fontSize={14}
                                horizontalTextAlign="left"
                                style={
                                  Array [
                                    Object {
                                      "color": "#000000",
                                      "fontFamily": "Rubik-Regular",
                                      "fontSize": 14,
                                      "textAlign": "left",
                                      "textAlignVertical": "center",
                                    },
                                  ]
                                }
                                verticalTextAlign="center"
                              >
                                Messages more there should be
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View
                      style={
                        Object {
                          "flex": 1,
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flexDirection": "row",
                            "paddingBottom": 30,
                          }
                        }
                      >
                        <View
                          style={
                            Object {
                              "alignItems": "center",
                              "flex": 1,
                              "paddingRight": 15,
                            }
                          }
                        />
                        <View
                          style={
                            Object {
                              "flex": 8,
                            }
                          }
                        >
                          <View
                            style={
                              Object {
                                "flexDirection": "row",
                                "paddingBottom": 3,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
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
                                obi
                              </Text>
                            </View>
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
                                  "paddingLeft": 8,
                                  "paddingTop": 2,
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
                                12:46
                              </Text>
                            </View>
                          </View>
                          <View
                            style={
                              Object {
                                "flexShrink": 1,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "paddingTop": 0,
                                }
                              }
                            >
                              <Text
                                color="main"
                                fontSize={14}
                                horizontalTextAlign="left"
                                style={
                                  Array [
                                    Object {
                                      "color": "#000000",
                                      "fontFamily": "Rubik-Regular",
                                      "fontSize": 14,
                                      "textAlign": "left",
                                      "textAlignVertical": "center",
                                    },
                                  ]
                                }
                                verticalTextAlign="center"
                              >
                                I Agree
                              </Text>
                            </View>
                            <View
                              style={
                                Object {
                                  "paddingTop": 4,
                                }
                              }
                            >
                              <Text
                                color="main"
                                fontSize={14}
                                horizontalTextAlign="left"
                                style={
                                  Array [
                                    Object {
                                      "color": "#000000",
                                      "fontFamily": "Rubik-Regular",
                                      "fontSize": 14,
                                      "textAlign": "left",
                                      "textAlignVertical": "center",
                                    },
                                  ]
                                }
                                verticalTextAlign="center"
                              >
                                Of course, I Agree
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View
                      style={
                        Object {
                          "flex": 1,
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flexDirection": "row",
                            "paddingBottom": 30,
                          }
                        }
                      >
                        <View
                          style={
                            Object {
                              "alignItems": "center",
                              "flex": 1,
                              "paddingRight": 15,
                            }
                          }
                        />
                        <View
                          style={
                            Object {
                              "flex": 8,
                            }
                          }
                        >
                          <View
                            style={
                              Object {
                                "flexDirection": "row",
                                "paddingBottom": 3,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
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
                                wookie
                              </Text>
                            </View>
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
                                  "paddingLeft": 8,
                                  "paddingTop": 2,
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
                                12:46
                              </Text>
                            </View>
                          </View>
                          <View
                            style={
                              Object {
                                "flexShrink": 1,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "paddingTop": 0,
                                }
                              }
                            >
                              <Text
                                color="main"
                                fontSize={14}
                                horizontalTextAlign="left"
                                style={
                                  Array [
                                    Object {
                                      "color": "#000000",
                                      "fontFamily": "Rubik-Regular",
                                      "fontSize": 14,
                                      "textAlign": "left",
                                      "textAlignVertical": "center",
                                    },
                                  ]
                                }
                                verticalTextAlign="center"
                              >
                                Wrough!
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View
                      style={
                        Object {
                          "flex": 1,
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flexDirection": "row",
                            "paddingBottom": 30,
                          }
                        }
                      >
                        <View
                          style={
                            Object {
                              "alignItems": "center",
                              "flex": 1,
                              "paddingRight": 15,
                            }
                          }
                        />
                        <View
                          style={
                            Object {
                              "flex": 8,
                            }
                          }
                        >
                          <View
                            style={
                              Object {
                                "flexDirection": "row",
                                "paddingBottom": 3,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
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
                                leah
                              </Text>
                            </View>
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
                                  "paddingLeft": 8,
                                  "paddingTop": 2,
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
                                12:46
                              </Text>
                            </View>
                          </View>
                          <View
                            style={
                              Object {
                                "flexShrink": 1,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "paddingTop": 0,
                                }
                              }
                            >
                              <Text
                                color="main"
                                fontSize={14}
                                horizontalTextAlign="left"
                                style={
                                  Array [
                                    Object {
                                      "color": "#000000",
                                      "fontFamily": "Rubik-Regular",
                                      "fontSize": 14,
                                      "textAlign": "left",
                                      "textAlignVertical": "center",
                                    },
                                  ]
                                }
                                verticalTextAlign="center"
                              >
                                Yeah!
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View
                      style={
                        Object {
                          "flex": 1,
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flexDirection": "row",
                            "paddingBottom": 30,
                          }
                        }
                      >
                        <View
                          style={
                            Object {
                              "alignItems": "center",
                              "flex": 1,
                              "paddingRight": 15,
                            }
                          }
                        />
                        <View
                          style={
                            Object {
                              "flex": 8,
                            }
                          }
                        >
                          <View
                            style={
                              Object {
                                "flexDirection": "row",
                                "paddingBottom": 3,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
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
                                luke
                              </Text>
                            </View>
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
                                  "paddingLeft": 8,
                                  "paddingTop": 2,
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
                                12:46
                              </Text>
                            </View>
                          </View>
                          <View
                            style={
                              Object {
                                "flexShrink": 1,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "paddingTop": 0,
                                }
                              }
                            >
                              <Text
                                color="main"
                                fontSize={14}
                                horizontalTextAlign="left"
                                style={
                                  Array [
                                    Object {
                                      "color": "#000000",
                                      "fontFamily": "Rubik-Regular",
                                      "fontSize": 14,
                                      "textAlign": "left",
                                      "textAlignVertical": "center",
                                    },
                                  ]
                                }
                                verticalTextAlign="center"
                              >
                                The more messages the better
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View
                      style={
                        Object {
                          "flex": 1,
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flexDirection": "row",
                            "paddingBottom": 30,
                          }
                        }
                      >
                        <View
                          style={
                            Object {
                              "alignItems": "center",
                              "flex": 1,
                              "paddingRight": 15,
                            }
                          }
                        />
                        <View
                          style={
                            Object {
                              "flex": 8,
                            }
                          }
                        >
                          <View
                            style={
                              Object {
                                "flexDirection": "row",
                                "paddingBottom": 3,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
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
                                windoo
                              </Text>
                            </View>
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
                                  "paddingLeft": 8,
                                  "paddingTop": 2,
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
                                12:46
                              </Text>
                            </View>
                          </View>
                          <View
                            style={
                              Object {
                                "flexShrink": 1,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "paddingTop": 0,
                                }
                              }
                            >
                              <Text
                                color="main"
                                fontSize={14}
                                horizontalTextAlign="left"
                                style={
                                  Array [
                                    Object {
                                      "color": "#000000",
                                      "fontFamily": "Rubik-Regular",
                                      "fontSize": 14,
                                      "textAlign": "left",
                                      "textAlignVertical": "center",
                                    },
                                  ]
                                }
                                verticalTextAlign="center"
                              >
                                We cannot grant you the rank of messager
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View
                      style={
                        Object {
                          "flex": 1,
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flexDirection": "row",
                            "paddingBottom": 30,
                          }
                        }
                      >
                        <View
                          style={
                            Object {
                              "alignItems": "center",
                              "flex": 1,
                              "paddingRight": 15,
                            }
                          }
                        />
                        <View
                          style={
                            Object {
                              "flex": 8,
                            }
                          }
                        >
                          <View
                            style={
                              Object {
                                "flexDirection": "row",
                                "paddingBottom": 3,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
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
                                vader
                              </Text>
                            </View>
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
                                  "paddingLeft": 8,
                                  "paddingTop": 2,
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
                                12:46
                              </Text>
                            </View>
                          </View>
                          <View
                            style={
                              Object {
                                "flexShrink": 1,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "paddingTop": 0,
                                }
                              }
                            >
                              <Text
                                color="main"
                                fontSize={14}
                                horizontalTextAlign="left"
                                style={
                                  Array [
                                    Object {
                                      "color": "#000000",
                                      "fontFamily": "Rubik-Regular",
                                      "fontSize": 14,
                                      "textAlign": "left",
                                      "textAlignVertical": "center",
                                    },
                                  ]
                                }
                                verticalTextAlign="center"
                              >
                                deathhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhstarrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrdeathstartttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr
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
                onLayout={[Function]}
                style={null}
              >
                <View
                  style={
                    Object {
                      "transform": Array [
                        Object {
                          "rotate": "180deg",
                        },
                      ],
                    }
                  }
                >
                  <View>
                    <View
                      style={
                        Object {
                          "flex": 1,
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flexDirection": "row",
                            "paddingBottom": 30,
                          }
                        }
                      >
                        <View
                          style={
                            Object {
                              "alignItems": "center",
                              "flex": 1,
                              "paddingRight": 15,
                            }
                          }
                        />
                        <View
                          style={
                            Object {
                              "flex": 8,
                            }
                          }
                        >
                          <View
                            style={
                              Object {
                                "flexDirection": "row",
                                "paddingBottom": 3,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
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
                                alice
                              </Text>
                            </View>
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
                                  "paddingLeft": 8,
                                  "paddingTop": 2,
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
                                28 Oct, 10:00
                              </Text>
                            </View>
                          </View>
                          <View
                            style={
                              Object {
                                "flexShrink": 1,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "paddingTop": 0,
                                }
                              }
                            >
                              <Text
                                color="main"
                                fontSize={14}
                                horizontalTextAlign="left"
                                style={
                                  Array [
                                    Object {
                                      "color": "#000000",
                                      "fontFamily": "Rubik-Regular",
                                      "fontSize": 14,
                                      "textAlign": "left",
                                      "textAlignVertical": "center",
                                    },
                                  ]
                                }
                                verticalTextAlign="center"
                              >
                                Hello
                              </Text>
                            </View>
                            <View
                              style={
                                Object {
                                  "paddingTop": 4,
                                }
                              }
                            >
                              <Text
                                color="main"
                                fontSize={14}
                                horizontalTextAlign="left"
                                style={
                                  Array [
                                    Object {
                                      "color": "#000000",
                                      "fontFamily": "Rubik-Regular",
                                      "fontSize": 14,
                                      "textAlign": "left",
                                      "textAlignVertical": "center",
                                    },
                                  ]
                                }
                                verticalTextAlign="center"
                              >
                                How are you? My day was awesome. I removed a lot of unused props from container and I simplified code a lot. I like coding, coding is like building things with LEGO. I could admit it's a little bit harder and there's a lot that can go wrong but I like it anyway.
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View
                      style={
                        Object {
                          "flex": 1,
                        }
                      }
                    >
                      <View
                        style={
                          Object {
                            "flexDirection": "row",
                            "paddingBottom": 30,
                          }
                        }
                      >
                        <View
                          style={
                            Object {
                              "alignItems": "center",
                              "flex": 1,
                              "paddingRight": 15,
                            }
                          }
                        />
                        <View
                          style={
                            Object {
                              "flex": 8,
                            }
                          }
                        >
                          <View
                            style={
                              Object {
                                "flexDirection": "row",
                                "paddingBottom": 3,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
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
                                john
                              </Text>
                            </View>
                            <View
                              style={
                                Object {
                                  "alignSelf": "flex-start",
                                  "paddingLeft": 8,
                                  "paddingTop": 2,
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
                                28 Oct, 10:02
                              </Text>
                            </View>
                          </View>
                          <View
                            style={
                              Object {
                                "flexShrink": 1,
                              }
                            }
                          >
                            <View
                              style={
                                Object {
                                  "paddingTop": 0,
                                }
                              }
                            >
                              <Text
                                color="main"
                                fontSize={14}
                                horizontalTextAlign="left"
                                style={
                                  Array [
                                    Object {
                                      "color": "#000000",
                                      "fontFamily": "Rubik-Regular",
                                      "fontSize": 14,
                                      "textAlign": "left",
                                      "textAlignVertical": "center",
                                    },
                                  ]
                                }
                                verticalTextAlign="center"
                              >
                                Great, thanks!
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </RCTScrollView>
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
                  "flex": 9,
                  "paddingLeft": 20,
                  "paddingRight": 20,
                }
              }
            >
              <View>
                <View
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
                    Array [
                      Object {
                        "backgroundColor": "#ffffff",
                        "borderColor": "#B3B3B3",
                        "borderRadius": 4,
                        "borderWidth": 1,
                        "flexGrow": 1,
                        "paddingLeft": 15,
                        "paddingRight": 15,
                      },
                    ]
                  }
                >
                  <TextInput
                    editable={true}
                    multiline={true}
                    onChangeText={[Function]}
                    placeholder="Message #Zbay"
                    style={
                      Array [
                        Object {
                          "paddingBottom": 12,
                          "paddingTop": 12,
                          "textAlignVertical": "center",
                        },
                      ]
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

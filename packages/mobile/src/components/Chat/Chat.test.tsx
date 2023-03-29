import React from 'react'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Chat } from './Chat.component'
import { Keyboard } from 'react-native'

jest.useFakeTimers()

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
                "backgroundColor": "#ffffff",
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
                        >
                          <View
                            style={
                              Object {
                                "width": 37,
                              }
                            }
                          >
                            <RNSVGSvgView
                              align="xMidYMid"
                              bbHeight="37"
                              bbWidth="37"
                              focusable={false}
                              height={37}
                              meetOrSlice={0}
                              minX={0}
                              minY={0}
                              style={
                                Array [
                                  Object {
                                    "backgroundColor": "transparent",
                                    "borderWidth": 0,
                                  },
                                  Object {
                                    "flex": 0,
                                    "height": 37,
                                    "width": 37,
                                  },
                                ]
                              }
                              vbHeight={37}
                              vbWidth={37}
                              width={37}
                              xml="<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"37\\" height=\\"37\\" viewBox=\\"0 0 37 37\\"><path fill=\\"#4c4c4c\\" d=\\"M18 11L11 11L11 4ZM18 11L18 4L25 4ZM18 25L25 25L25 32ZM18 25L18 32L11 32ZM11 18L4 18L4 11ZM25 18L25 11L32 11ZM25 18L32 18L32 25ZM11 18L11 25L4 25Z\\"/><path fill=\\"#e5e5e5\\" d=\\"M11 11L4 11L4 4ZM25 11L25 4L32 4ZM25 25L32 25L32 32ZM11 25L11 32L4 32Z\\"/><path fill=\\"#cca966\\" d=\\"M13 13L17 13L17 17L13 17ZM23 13L23 17L19 17L19 13ZM23 23L19 23L19 19L23 19ZM13 23L13 19L17 19L17 23Z\\"/></svg>"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <RNSVGGroup
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                              >
                                <RNSVGPath
                                  d="M18 11L11 11L11 4ZM18 11L18 4L25 4ZM18 25L25 25L25 32ZM18 25L18 32L11 32ZM11 18L4 18L4 11ZM25 18L25 11L32 11ZM25 18L32 18L32 25ZM11 18L11 25L4 25Z"
                                  fill={
                                    Object {
                                      "payload": 4283190348,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M11 11L4 11L4 4ZM25 11L25 4L32 4ZM25 25L32 25L32 32ZM11 25L11 32L4 32Z"
                                  fill={
                                    Object {
                                      "payload": 4293256677,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M13 13L17 13L17 17L13 17ZM23 13L23 17L19 17L19 13ZM23 23L19 23L19 19L23 19ZM13 23L13 19L17 19L17 23Z"
                                  fill={
                                    Object {
                                      "payload": 4291602790,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                              </RNSVGGroup>
                            </RNSVGSvgView>
                          </View>
                        </View>
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
                        >
                          <View
                            style={
                              Object {
                                "width": 37,
                              }
                            }
                          >
                            <RNSVGSvgView
                              align="xMidYMid"
                              bbHeight="37"
                              bbWidth="37"
                              focusable={false}
                              height={37}
                              meetOrSlice={0}
                              minX={0}
                              minY={0}
                              style={
                                Array [
                                  Object {
                                    "backgroundColor": "transparent",
                                    "borderWidth": 0,
                                  },
                                  Object {
                                    "flex": 0,
                                    "height": 37,
                                    "width": 37,
                                  },
                                ]
                              }
                              vbHeight={37}
                              vbWidth={37}
                              width={37}
                              xml="<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"37\\" height=\\"37\\" viewBox=\\"0 0 37 37\\"><path fill=\\"#5994c7\\" d=\\"M11 11L11 4L14.5 4ZM18 4L25 4L25 7.5ZM25 25L25 32L21.5 32ZM18 32L11 32L11 28.5ZM4 18L4 11L7.5 11ZM25 11L32 11L32 14.5ZM32 18L32 25L28.5 25ZM11 25L4 25L4 21.5Z\\"/><path fill=\\"#464646\\" d=\\"M4 7.5L7.5 4L11 7.5L7.5 11ZM28.5 4L32 7.5L28.5 11L25 7.5ZM32 28.5L28.5 32L25 28.5L28.5 25ZM7.5 32L4 28.5L7.5 25L11 28.5Z\\"/><path fill=\\"#acc9e3\\" d=\\"M11 11L18 11L18 18L11 18ZM13 17L17 17L17 13L13 13ZM25 11L25 18L18 18L18 11ZM19 13L19 17L23 17L23 13ZM25 25L18 25L18 18L25 18ZM23 19L19 19L19 23L23 23ZM11 25L11 18L18 18L18 25ZM17 23L17 19L13 19L13 23Z\\"/></svg>"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <RNSVGGroup
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                              >
                                <RNSVGPath
                                  d="M11 11L11 4L14.5 4ZM18 4L25 4L25 7.5ZM25 25L25 32L21.5 32ZM18 32L11 32L11 28.5ZM4 18L4 11L7.5 11ZM25 11L32 11L32 14.5ZM32 18L32 25L28.5 25ZM11 25L4 25L4 21.5Z"
                                  fill={
                                    Object {
                                      "payload": 4284060871,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M4 7.5L7.5 4L11 7.5L7.5 11ZM28.5 4L32 7.5L28.5 11L25 7.5ZM32 28.5L28.5 32L25 28.5L28.5 25ZM7.5 32L4 28.5L7.5 25L11 28.5Z"
                                  fill={
                                    Object {
                                      "payload": 4282795590,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M11 11L18 11L18 18L11 18ZM13 17L17 17L17 13L13 13ZM25 11L25 18L18 18L18 11ZM19 13L19 17L23 17L23 13ZM25 25L18 25L18 18L25 18ZM23 19L19 19L19 23L23 23ZM11 25L11 18L18 18L18 25ZM17 23L17 19L13 19L13 23Z"
                                  fill={
                                    Object {
                                      "payload": 4289513955,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                              </RNSVGGroup>
                            </RNSVGSvgView>
                          </View>
                        </View>
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
                        >
                          <View
                            style={
                              Object {
                                "width": 37,
                              }
                            }
                          >
                            <RNSVGSvgView
                              align="xMidYMid"
                              bbHeight="37"
                              bbWidth="37"
                              focusable={false}
                              height={37}
                              meetOrSlice={0}
                              minX={0}
                              minY={0}
                              style={
                                Array [
                                  Object {
                                    "backgroundColor": "transparent",
                                    "borderWidth": 0,
                                  },
                                  Object {
                                    "flex": 0,
                                    "height": 37,
                                    "width": 37,
                                  },
                                ]
                              }
                              vbHeight={37}
                              vbWidth={37}
                              width={37}
                              xml="<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"37\\" height=\\"37\\" viewBox=\\"0 0 37 37\\"><path fill=\\"#5994c7\\" d=\\"M11 11L11 4L14.5 4ZM18 4L25 4L25 7.5ZM25 25L25 32L21.5 32ZM18 32L11 32L11 28.5ZM4 18L4 11L7.5 11ZM25 11L32 11L32 14.5ZM32 18L32 25L28.5 25ZM11 25L4 25L4 21.5Z\\"/><path fill=\\"#464646\\" d=\\"M4 7.5L7.5 4L11 7.5L7.5 11ZM28.5 4L32 7.5L28.5 11L25 7.5ZM32 28.5L28.5 32L25 28.5L28.5 25ZM7.5 32L4 28.5L7.5 25L11 28.5Z\\"/><path fill=\\"#acc9e3\\" d=\\"M11 11L18 11L18 18L11 18ZM13 17L17 17L17 13L13 13ZM25 11L25 18L18 18L18 11ZM19 13L19 17L23 17L23 13ZM25 25L18 25L18 18L25 18ZM23 19L19 19L19 23L23 23ZM11 25L11 18L18 18L18 25ZM17 23L17 19L13 19L13 23Z\\"/></svg>"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <RNSVGGroup
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                              >
                                <RNSVGPath
                                  d="M11 11L11 4L14.5 4ZM18 4L25 4L25 7.5ZM25 25L25 32L21.5 32ZM18 32L11 32L11 28.5ZM4 18L4 11L7.5 11ZM25 11L32 11L32 14.5ZM32 18L32 25L28.5 25ZM11 25L4 25L4 21.5Z"
                                  fill={
                                    Object {
                                      "payload": 4284060871,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M4 7.5L7.5 4L11 7.5L7.5 11ZM28.5 4L32 7.5L28.5 11L25 7.5ZM32 28.5L28.5 32L25 28.5L28.5 25ZM7.5 32L4 28.5L7.5 25L11 28.5Z"
                                  fill={
                                    Object {
                                      "payload": 4282795590,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M11 11L18 11L18 18L11 18ZM13 17L17 17L17 13L13 13ZM25 11L25 18L18 18L18 11ZM19 13L19 17L23 17L23 13ZM25 25L18 25L18 18L25 18ZM23 19L19 19L19 23L23 23ZM11 25L11 18L18 18L18 25ZM17 23L17 19L13 19L13 23Z"
                                  fill={
                                    Object {
                                      "payload": 4289513955,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                              </RNSVGGroup>
                            </RNSVGSvgView>
                          </View>
                        </View>
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
                        >
                          <View
                            style={
                              Object {
                                "width": 37,
                              }
                            }
                          >
                            <RNSVGSvgView
                              align="xMidYMid"
                              bbHeight="37"
                              bbWidth="37"
                              focusable={false}
                              height={37}
                              meetOrSlice={0}
                              minX={0}
                              minY={0}
                              style={
                                Array [
                                  Object {
                                    "backgroundColor": "transparent",
                                    "borderWidth": 0,
                                  },
                                  Object {
                                    "flex": 0,
                                    "height": 37,
                                    "width": 37,
                                  },
                                ]
                              }
                              vbHeight={37}
                              vbWidth={37}
                              width={37}
                              xml="<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"37\\" height=\\"37\\" viewBox=\\"0 0 37 37\\"><path fill=\\"#d6bae8\\" d=\\"M14.5 4L18 7.5L14.5 11L11 7.5ZM25 7.5L21.5 11L18 7.5L21.5 4ZM21.5 32L18 28.5L21.5 25L25 28.5ZM11 28.5L14.5 25L18 28.5L14.5 32ZM7.5 11L11 14.5L7.5 18L4 14.5ZM32 14.5L28.5 18L25 14.5L28.5 11ZM28.5 25L25 21.5L28.5 18L32 21.5ZM4 21.5L7.5 18L11 21.5L7.5 25Z\\"/><path fill=\\"#ae75d1\\" d=\\"M11 4L11 11L7.5 11ZM32 11L25 11L25 7.5ZM25 32L25 25L28.5 25ZM4 25L11 25L11 28.5Z\\"/><path fill=\\"#7e38a8\\" d=\\"M11 11L18 11L18 18L11 18ZM13.5 15.3a1.8,1.8 0 1,0 3.6,0a1.8,1.8 0 1,0 -3.6,0M25 11L25 18L18 18L18 11ZM18.8 15.3a1.8,1.8 0 1,0 3.6,0a1.8,1.8 0 1,0 -3.6,0M25 25L18 25L18 18L25 18ZM18.8 20.7a1.8,1.8 0 1,0 3.6,0a1.8,1.8 0 1,0 -3.6,0M11 25L11 18L18 18L18 25ZM13.5 20.7a1.8,1.8 0 1,0 3.6,0a1.8,1.8 0 1,0 -3.6,0\\"/></svg>"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <RNSVGGroup
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                              >
                                <RNSVGPath
                                  d="M14.5 4L18 7.5L14.5 11L11 7.5ZM25 7.5L21.5 11L18 7.5L21.5 4ZM21.5 32L18 28.5L21.5 25L25 28.5ZM11 28.5L14.5 25L18 28.5L14.5 32ZM7.5 11L11 14.5L7.5 18L4 14.5ZM32 14.5L28.5 18L25 14.5L28.5 11ZM28.5 25L25 21.5L28.5 18L32 21.5ZM4 21.5L7.5 18L11 21.5L7.5 25Z"
                                  fill={
                                    Object {
                                      "payload": 4292262632,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M11 4L11 11L7.5 11ZM32 11L25 11L25 7.5ZM25 32L25 25L28.5 25ZM4 25L11 25L11 28.5Z"
                                  fill={
                                    Object {
                                      "payload": 4289623505,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M11 11L18 11L18 18L11 18ZM13.5 15.3a1.8,1.8 0 1,0 3.6,0a1.8,1.8 0 1,0 -3.6,0M25 11L25 18L18 18L18 11ZM18.8 15.3a1.8,1.8 0 1,0 3.6,0a1.8,1.8 0 1,0 -3.6,0M25 25L18 25L18 18L25 18ZM18.8 20.7a1.8,1.8 0 1,0 3.6,0a1.8,1.8 0 1,0 -3.6,0M11 25L11 18L18 18L18 25ZM13.5 20.7a1.8,1.8 0 1,0 3.6,0a1.8,1.8 0 1,0 -3.6,0"
                                  fill={
                                    Object {
                                      "payload": 4286462120,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                              </RNSVGGroup>
                            </RNSVGSvgView>
                          </View>
                        </View>
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
                        >
                          <View
                            style={
                              Object {
                                "width": 37,
                              }
                            }
                          >
                            <RNSVGSvgView
                              align="xMidYMid"
                              bbHeight="37"
                              bbWidth="37"
                              focusable={false}
                              height={37}
                              meetOrSlice={0}
                              minX={0}
                              minY={0}
                              style={
                                Array [
                                  Object {
                                    "backgroundColor": "transparent",
                                    "borderWidth": 0,
                                  },
                                  Object {
                                    "flex": 0,
                                    "height": 37,
                                    "width": 37,
                                  },
                                ]
                              }
                              vbHeight={37}
                              vbWidth={37}
                              width={37}
                              xml="<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"37\\" height=\\"37\\" viewBox=\\"0 0 37 37\\"><path fill=\\"#6f3db7\\" d=\\"M18 11L11 11L11 7.5ZM18 11L18 4L21.5 4ZM18 25L25 25L25 28.5ZM18 25L18 32L14.5 32ZM11 18L4 18L4 14.5ZM25 18L25 11L28.5 11ZM25 18L32 18L32 21.5ZM11 18L11 25L7.5 25Z\\"/><path fill=\\"#a684d6\\" d=\\"M4 4L11 4L11 11ZM32 4L32 11L25 11ZM32 32L25 32L25 25ZM4 32L4 25L11 25Z\\"/><path fill=\\"#eaeaea\\" d=\\"M11 11L18 11L18 18L11 18ZM12.8 15.4L15.4 18L18 15.4L15.4 12.8ZM25 11L25 18L18 18L18 11ZM20.6 12.8L18 15.4L20.6 18L23.3 15.4ZM25 25L18 25L18 18L25 18ZM23.3 20.6L20.6 18L18 20.6L20.6 23.3ZM11 25L11 18L18 18L18 25ZM15.4 23.3L18 20.6L15.4 18L12.8 20.6Z\\"/></svg>"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <RNSVGGroup
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                              >
                                <RNSVGPath
                                  d="M18 11L11 11L11 7.5ZM18 11L18 4L21.5 4ZM18 25L25 25L25 28.5ZM18 25L18 32L14.5 32ZM11 18L4 18L4 14.5ZM25 18L25 11L28.5 11ZM25 18L32 18L32 21.5ZM11 18L11 25L7.5 25Z"
                                  fill={
                                    Object {
                                      "payload": 4285480375,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M4 4L11 4L11 11ZM32 4L32 11L25 11ZM32 32L25 32L25 25ZM4 32L4 25L11 25Z"
                                  fill={
                                    Object {
                                      "payload": 4289103062,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M11 11L18 11L18 18L11 18ZM12.8 15.4L15.4 18L18 15.4L15.4 12.8ZM25 11L25 18L18 18L18 11ZM20.6 12.8L18 15.4L20.6 18L23.3 15.4ZM25 25L18 25L18 18L25 18ZM23.3 20.6L20.6 18L18 20.6L20.6 23.3ZM11 25L11 18L18 18L18 25ZM15.4 23.3L18 20.6L15.4 18L12.8 20.6Z"
                                  fill={
                                    Object {
                                      "payload": 4293585642,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                              </RNSVGGroup>
                            </RNSVGSvgView>
                          </View>
                        </View>
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
                        >
                          <View
                            style={
                              Object {
                                "width": 37,
                              }
                            }
                          >
                            <RNSVGSvgView
                              align="xMidYMid"
                              bbHeight="37"
                              bbWidth="37"
                              focusable={false}
                              height={37}
                              meetOrSlice={0}
                              minX={0}
                              minY={0}
                              style={
                                Array [
                                  Object {
                                    "backgroundColor": "transparent",
                                    "borderWidth": 0,
                                  },
                                  Object {
                                    "flex": 0,
                                    "height": 37,
                                    "width": 37,
                                  },
                                ]
                              }
                              vbHeight={37}
                              vbWidth={37}
                              width={37}
                              xml="<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"37\\" height=\\"37\\" viewBox=\\"0 0 37 37\\"><path fill=\\"#5b5b5b\\" d=\\"M18 7.5L14.5 11L11 7.5L14.5 4ZM21.5 11L18 7.5L21.5 4L25 7.5ZM18 28.5L21.5 25L25 28.5L21.5 32ZM14.5 25L18 28.5L14.5 32L11 28.5ZM11 14.5L7.5 18L4 14.5L7.5 11ZM28.5 18L25 14.5L28.5 11L32 14.5ZM25 21.5L28.5 18L32 21.5L28.5 25ZM7.5 18L11 21.5L7.5 25L4 21.5Z\\"/><path fill=\\"#eaeaea\\" d=\\"M4 11L4 4L7.5 4ZM25 4L32 4L32 7.5ZM32 25L32 32L28.5 32ZM11 32L4 32L4 28.5Z\\"/><path fill=\\"#a684d6\\" d=\\"M11 11L18 11L18 12.1L15.1 18L11 18ZM25 11L25 18L23.9 18L18 15.1L18 11ZM25 25L18 25L18 23.9L20.9 18L25 18ZM11 25L11 18L12.1 18L18 20.9L18 25Z\\"/></svg>"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <RNSVGGroup
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                              >
                                <RNSVGPath
                                  d="M18 7.5L14.5 11L11 7.5L14.5 4ZM21.5 11L18 7.5L21.5 4L25 7.5ZM18 28.5L21.5 25L25 28.5L21.5 32ZM14.5 25L18 28.5L14.5 32L11 28.5ZM11 14.5L7.5 18L4 14.5L7.5 11ZM28.5 18L25 14.5L28.5 11L32 14.5ZM25 21.5L28.5 18L32 21.5L28.5 25ZM7.5 18L11 21.5L7.5 25L4 21.5Z"
                                  fill={
                                    Object {
                                      "payload": 4284177243,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M4 11L4 4L7.5 4ZM25 4L32 4L32 7.5ZM32 25L32 32L28.5 32ZM11 32L4 32L4 28.5Z"
                                  fill={
                                    Object {
                                      "payload": 4293585642,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M11 11L18 11L18 12.1L15.1 18L11 18ZM25 11L25 18L23.9 18L18 15.1L18 11ZM25 25L18 25L18 23.9L20.9 18L25 18ZM11 25L11 18L12.1 18L18 20.9L18 25Z"
                                  fill={
                                    Object {
                                      "payload": 4289103062,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                              </RNSVGGroup>
                            </RNSVGSvgView>
                          </View>
                        </View>
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
                        >
                          <View
                            style={
                              Object {
                                "width": 37,
                              }
                            }
                          >
                            <RNSVGSvgView
                              align="xMidYMid"
                              bbHeight="37"
                              bbWidth="37"
                              focusable={false}
                              height={37}
                              meetOrSlice={0}
                              minX={0}
                              minY={0}
                              style={
                                Array [
                                  Object {
                                    "backgroundColor": "transparent",
                                    "borderWidth": 0,
                                  },
                                  Object {
                                    "flex": 0,
                                    "height": 37,
                                    "width": 37,
                                  },
                                ]
                              }
                              vbHeight={37}
                              vbWidth={37}
                              width={37}
                              xml="<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"37\\" height=\\"37\\" viewBox=\\"0 0 37 37\\"><path fill=\\"#633db7\\" d=\\"M11 4L18 4L18 7.5ZM25 4L25 11L21.5 11ZM25 32L18 32L18 28.5ZM11 32L11 25L14.5 25ZM4 11L11 11L11 14.5ZM32 11L32 18L28.5 18ZM32 25L25 25L25 21.5ZM4 25L4 18L7.5 18Z\\"/><path fill=\\"#eaeaea\\" d=\\"M4 4L11 4L11 11ZM32 4L32 11L25 11ZM32 32L25 32L25 25ZM4 32L4 25L11 25Z\\"/><path fill=\\"#9e84d6\\" d=\\"M18 11L18 16L15 11ZM25 18L20 18L25 15ZM18 25L18 20L21 25ZM11 18L16 18L11 21Z\\"/></svg>"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <RNSVGGroup
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                              >
                                <RNSVGPath
                                  d="M11 4L18 4L18 7.5ZM25 4L25 11L21.5 11ZM25 32L18 32L18 28.5ZM11 32L11 25L14.5 25ZM4 11L11 11L11 14.5ZM32 11L32 18L28.5 18ZM32 25L25 25L25 21.5ZM4 25L4 18L7.5 18Z"
                                  fill={
                                    Object {
                                      "payload": 4284693943,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M4 4L11 4L11 11ZM32 4L32 11L25 11ZM32 32L25 32L25 25ZM4 32L4 25L11 25Z"
                                  fill={
                                    Object {
                                      "payload": 4293585642,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M18 11L18 16L15 11ZM25 18L20 18L25 15ZM18 25L18 20L21 25ZM11 18L16 18L11 21Z"
                                  fill={
                                    Object {
                                      "payload": 4288578774,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                              </RNSVGGroup>
                            </RNSVGSvgView>
                          </View>
                        </View>
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
                        >
                          <View
                            style={
                              Object {
                                "width": 37,
                              }
                            }
                          >
                            <RNSVGSvgView
                              align="xMidYMid"
                              bbHeight="37"
                              bbWidth="37"
                              focusable={false}
                              height={37}
                              meetOrSlice={0}
                              minX={0}
                              minY={0}
                              style={
                                Array [
                                  Object {
                                    "backgroundColor": "transparent",
                                    "borderWidth": 0,
                                  },
                                  Object {
                                    "flex": 0,
                                    "height": 37,
                                    "width": 37,
                                  },
                                ]
                              }
                              vbHeight={37}
                              vbWidth={37}
                              width={37}
                              xml="<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"37\\" height=\\"37\\" viewBox=\\"0 0 37 37\\"><path fill=\\"#329956\\" d=\\"M12.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M19.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M19.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M12.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 14.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 14.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 21.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 21.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0\\"/><path fill=\\"#b2e5c4\\" d=\\"M4 11L4 4L7.5 4ZM25 4L32 4L32 7.5ZM32 25L32 32L28.5 32ZM11 32L4 32L4 28.5Z\\"/><path fill=\\"#66cc89\\" d=\\"M18 14.5L18 18L14.5 18ZM21.5 18L18 18L18 14.5ZM18 21.5L18 18L21.5 18ZM14.5 18L18 18L18 21.5Z\\"/></svg>"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <RNSVGGroup
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                              >
                                <RNSVGPath
                                  d="M12.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M19.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M19.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M12.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 14.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 14.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 21.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 21.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0"
                                  fill={
                                    Object {
                                      "payload": 4281506134,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M4 11L4 4L7.5 4ZM25 4L32 4L32 7.5ZM32 25L32 32L28.5 32ZM11 32L4 32L4 28.5Z"
                                  fill={
                                    Object {
                                      "payload": 4289914308,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M18 14.5L18 18L14.5 18ZM21.5 18L18 18L18 14.5ZM18 21.5L18 18L21.5 18ZM14.5 18L18 18L18 21.5Z"
                                  fill={
                                    Object {
                                      "payload": 4284927113,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                              </RNSVGGroup>
                            </RNSVGSvgView>
                          </View>
                        </View>
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
                        >
                          <View
                            style={
                              Object {
                                "width": 37,
                              }
                            }
                          >
                            <RNSVGSvgView
                              align="xMidYMid"
                              bbHeight="37"
                              bbWidth="37"
                              focusable={false}
                              height={37}
                              meetOrSlice={0}
                              minX={0}
                              minY={0}
                              style={
                                Array [
                                  Object {
                                    "backgroundColor": "transparent",
                                    "borderWidth": 0,
                                  },
                                  Object {
                                    "flex": 0,
                                    "height": 37,
                                    "width": 37,
                                  },
                                ]
                              }
                              vbHeight={37}
                              vbWidth={37}
                              width={37}
                              xml="<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"37\\" height=\\"37\\" viewBox=\\"0 0 37 37\\"><path fill=\\"#e0bae8\\" d=\\"M11 4L18 4L18 11ZM25 4L25 11L18 11ZM25 32L18 32L18 25ZM11 32L11 25L18 25ZM4 11L11 11L11 18ZM32 11L32 18L25 18ZM32 25L25 25L25 18ZM4 25L4 18L11 18Z\\"/><path fill=\\"#c175d1\\" d=\\"M11 11L4 11L4 7.5ZM25 11L25 4L28.5 4ZM25 25L32 25L32 28.5ZM11 25L11 32L7.5 32ZM11 11L18 11L18 15.9L13.8 13.8L15.9 18L11 18ZM25 11L25 18L20.1 18L22.2 13.8L18 15.9L18 11ZM25 25L18 25L18 20.1L22.2 22.2L20.1 18L25 18ZM11 25L11 18L15.9 18L13.8 22.2L18 20.1L18 25Z\\"/></svg>"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <RNSVGGroup
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                              >
                                <RNSVGPath
                                  d="M11 4L18 4L18 11ZM25 4L25 11L18 11ZM25 32L18 32L18 25ZM11 32L11 25L18 25ZM4 11L11 11L11 18ZM32 11L32 18L25 18ZM32 25L25 25L25 18ZM4 25L4 18L11 18Z"
                                  fill={
                                    Object {
                                      "payload": 4292917992,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M11 11L4 11L4 7.5ZM25 11L25 4L28.5 4ZM25 25L32 25L32 28.5ZM11 25L11 32L7.5 32ZM11 11L18 11L18 15.9L13.8 13.8L15.9 18L11 18ZM25 11L25 18L20.1 18L22.2 13.8L18 15.9L18 11ZM25 25L18 25L18 20.1L22.2 22.2L20.1 18L25 18ZM11 25L11 18L15.9 18L13.8 22.2L18 20.1L18 25Z"
                                  fill={
                                    Object {
                                      "payload": 4290868689,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                              </RNSVGGroup>
                            </RNSVGSvgView>
                          </View>
                        </View>
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
                        >
                          <View
                            style={
                              Object {
                                "width": 37,
                              }
                            }
                          >
                            <RNSVGSvgView
                              align="xMidYMid"
                              bbHeight="37"
                              bbWidth="37"
                              focusable={false}
                              height={37}
                              meetOrSlice={0}
                              minX={0}
                              minY={0}
                              style={
                                Array [
                                  Object {
                                    "backgroundColor": "transparent",
                                    "borderWidth": 0,
                                  },
                                  Object {
                                    "flex": 0,
                                    "height": 37,
                                    "width": 37,
                                  },
                                ]
                              }
                              vbHeight={37}
                              vbWidth={37}
                              width={37}
                              xml="<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"37\\" height=\\"37\\" viewBox=\\"0 0 37 37\\"><path fill=\\"#eaeaea\\" d=\\"M18 7.5L14.5 11L11 7.5L14.5 4ZM21.5 11L18 7.5L21.5 4L25 7.5ZM18 28.5L21.5 25L25 28.5L21.5 32ZM14.5 25L18 28.5L14.5 32L11 28.5ZM11 14.5L7.5 18L4 14.5L7.5 11ZM28.5 18L25 14.5L28.5 11L32 14.5ZM25 21.5L28.5 18L32 21.5L28.5 25ZM7.5 18L11 21.5L7.5 25L4 21.5Z\\"/><path fill=\\"#5b5b5b\\" d=\\"M5.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0\\"/><path fill=\\"#a584d6\\" d=\\"M13 13L18 13L18 18L13 18ZM23 13L23 18L18 18L18 13ZM23 23L18 23L18 18L23 18ZM13 23L13 18L18 18L18 23Z\\"/></svg>"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <RNSVGGroup
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                              >
                                <RNSVGPath
                                  d="M18 7.5L14.5 11L11 7.5L14.5 4ZM21.5 11L18 7.5L21.5 4L25 7.5ZM18 28.5L21.5 25L25 28.5L21.5 32ZM14.5 25L18 28.5L14.5 32L11 28.5ZM11 14.5L7.5 18L4 14.5L7.5 11ZM28.5 18L25 14.5L28.5 11L32 14.5ZM25 21.5L28.5 18L32 21.5L28.5 25ZM7.5 18L11 21.5L7.5 25L4 21.5Z"
                                  fill={
                                    Object {
                                      "payload": 4293585642,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M5.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0"
                                  fill={
                                    Object {
                                      "payload": 4284177243,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M13 13L18 13L18 18L13 18ZM23 13L23 18L18 18L18 13ZM23 23L18 23L18 18L23 18ZM13 23L13 18L18 18L18 23Z"
                                  fill={
                                    Object {
                                      "payload": 4289037526,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                              </RNSVGGroup>
                            </RNSVGSvgView>
                          </View>
                        </View>
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
                        >
                          <View
                            style={
                              Object {
                                "width": 37,
                              }
                            }
                          >
                            <RNSVGSvgView
                              align="xMidYMid"
                              bbHeight="37"
                              bbWidth="37"
                              focusable={false}
                              height={37}
                              meetOrSlice={0}
                              minX={0}
                              minY={0}
                              style={
                                Array [
                                  Object {
                                    "backgroundColor": "transparent",
                                    "borderWidth": 0,
                                  },
                                  Object {
                                    "flex": 0,
                                    "height": 37,
                                    "width": 37,
                                  },
                                ]
                              }
                              vbHeight={37}
                              vbWidth={37}
                              width={37}
                              xml="<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"37\\" height=\\"37\\" viewBox=\\"0 0 37 37\\"><path fill=\\"#e5d7b2\\" d=\\"M11 7.5L14.5 4L18 7.5L14.5 11ZM21.5 4L25 7.5L21.5 11L18 7.5ZM25 28.5L21.5 32L18 28.5L21.5 25ZM14.5 32L11 28.5L14.5 25L18 28.5ZM4 14.5L7.5 11L11 14.5L7.5 18ZM28.5 11L32 14.5L28.5 18L25 14.5ZM32 21.5L28.5 25L25 21.5L28.5 18ZM7.5 25L4 21.5L7.5 18L11 21.5Z\\"/><path fill=\\"#4c4c4c\\" d=\\"M4 7.5L7.5 4L11 7.5L7.5 11ZM28.5 4L32 7.5L28.5 11L25 7.5ZM32 28.5L28.5 32L25 28.5L28.5 25ZM7.5 32L4 28.5L7.5 25L11 28.5Z\\"/><path fill=\\"#ccaf66\\" d=\\"M13 13L18 13L18 18L13 18ZM23 13L23 18L18 18L18 13ZM23 23L18 23L18 18L23 18ZM13 23L13 18L18 18L18 23Z\\"/></svg>"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <RNSVGGroup
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                              >
                                <RNSVGPath
                                  d="M11 7.5L14.5 4L18 7.5L14.5 11ZM21.5 4L25 7.5L21.5 11L18 7.5ZM25 28.5L21.5 32L18 28.5L21.5 25ZM14.5 32L11 28.5L14.5 25L18 28.5ZM4 14.5L7.5 11L11 14.5L7.5 18ZM28.5 11L32 14.5L28.5 18L25 14.5ZM32 21.5L28.5 25L25 21.5L28.5 18ZM7.5 25L4 21.5L7.5 18L11 21.5Z"
                                  fill={
                                    Object {
                                      "payload": 4293253042,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M4 7.5L7.5 4L11 7.5L7.5 11ZM28.5 4L32 7.5L28.5 11L25 7.5ZM32 28.5L28.5 32L25 28.5L28.5 25ZM7.5 32L4 28.5L7.5 25L11 28.5Z"
                                  fill={
                                    Object {
                                      "payload": 4283190348,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M13 13L18 13L18 18L13 18ZM23 13L23 18L18 18L18 13ZM23 23L18 23L18 18L23 18ZM13 23L13 18L18 18L18 23Z"
                                  fill={
                                    Object {
                                      "payload": 4291604326,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                              </RNSVGGroup>
                            </RNSVGSvgView>
                          </View>
                        </View>
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
                        >
                          <View
                            style={
                              Object {
                                "width": 37,
                              }
                            }
                          >
                            <RNSVGSvgView
                              align="xMidYMid"
                              bbHeight="37"
                              bbWidth="37"
                              focusable={false}
                              height={37}
                              meetOrSlice={0}
                              minX={0}
                              minY={0}
                              style={
                                Array [
                                  Object {
                                    "backgroundColor": "transparent",
                                    "borderWidth": 0,
                                  },
                                  Object {
                                    "flex": 0,
                                    "height": 37,
                                    "width": 37,
                                  },
                                ]
                              }
                              vbHeight={37}
                              vbWidth={37}
                              width={37}
                              xml="<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"37\\" height=\\"37\\" viewBox=\\"0 0 37 37\\"><path fill=\\"#e5e5e5\\" d=\\"M11 11L11 4L14.5 4ZM18 4L25 4L25 7.5ZM25 25L25 32L21.5 32ZM18 32L11 32L11 28.5ZM4 18L4 11L7.5 11ZM25 11L32 11L32 14.5ZM32 18L32 25L28.5 25ZM11 25L4 25L4 21.5Z\\"/><path fill=\\"#4c4c4c\\" d=\\"M4 4L11 4L11 7.5ZM32 4L32 11L28.5 11ZM32 32L25 32L25 28.5ZM4 32L4 25L7.5 25Z\\"/><path fill=\\"#becc66\\" d=\\"M11 11L18 11L18 18L11 18ZM15.6 17.3L17.3 13.8L13.8 13.8ZM25 11L25 18L18 18L18 11ZM18.7 15.6L22.2 17.3L22.2 13.8ZM25 25L18 25L18 18L25 18ZM20.5 18.7L18.7 22.2L22.2 22.2ZM11 25L11 18L18 18L18 25ZM17.3 20.5L13.8 18.7L13.8 22.2Z\\"/></svg>"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <RNSVGGroup
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                              >
                                <RNSVGPath
                                  d="M11 11L11 4L14.5 4ZM18 4L25 4L25 7.5ZM25 25L25 32L21.5 32ZM18 32L11 32L11 28.5ZM4 18L4 11L7.5 11ZM25 11L32 11L32 14.5ZM32 18L32 25L28.5 25ZM11 25L4 25L4 21.5Z"
                                  fill={
                                    Object {
                                      "payload": 4293256677,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M4 4L11 4L11 7.5ZM32 4L32 11L28.5 11ZM32 32L25 32L25 28.5ZM4 32L4 25L7.5 25Z"
                                  fill={
                                    Object {
                                      "payload": 4283190348,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                                <RNSVGPath
                                  d="M11 11L18 11L18 18L11 18ZM15.6 17.3L17.3 13.8L13.8 13.8ZM25 11L25 18L18 18L18 11ZM18.7 15.6L22.2 17.3L22.2 13.8ZM25 25L18 25L18 18L25 18ZM20.5 18.7L18.7 22.2L22.2 22.2ZM11 25L11 18L18 18L18 25ZM17.3 20.5L13.8 18.7L13.8 22.2Z"
                                  fill={
                                    Object {
                                      "payload": 4290694246,
                                      "type": 0,
                                    }
                                  }
                                  propList={
                                    Array [
                                      "fill",
                                    ]
                                  }
                                />
                              </RNSVGGroup>
                            </RNSVGSvgView>
                          </View>
                        </View>
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
                "paddingBottom": 20,
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

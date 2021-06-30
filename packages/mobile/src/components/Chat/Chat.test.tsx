import React from 'react';

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent';
import { Chat } from './Chat.component';
import { Keyboard } from 'react-native';

jest.useFakeTimers();

describe('Chat component', () => {
  jest
    .spyOn(Keyboard, 'addListener')
    // @ts-ignore
    .mockImplementation(() => ({ remove: jest.fn() }));
  jest.spyOn(Keyboard, 'removeListener').mockImplementation(() => null);

  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <Chat
        sendMessageAction={jest.fn()}
        channel={{
          name: 'Zbay',
          description: '',
          owner: '',
          timestamp: 0,
          address: '',
        }}
        messages={[
          {
            id: '1',
            message:
              'Brownie powder marshmallow dessert carrot cake marzipan cake caramels. Muffin topping wafer jelly apple pie candy. Fruitcake chocolate pudding fruitcake candy lemon drops chocolate.',
            nickname: 'holmes',
            datetime: '1:30pm',
          },
          {
            id: '2',
            message:
              'Bear claw bear claw donut marzipan chocolate cake sugar plum pie. Chocolate cake chocolate bar ice cream. Marzipan powder brownie muffin jelly beans. Sesame snaps tootsie roll macaroon donut.',
            nickname: 'holmes',
            datetime: '1:32pm',
          },
          {
            id: '3',
            message: 'Marshmallows!',
            nickname: 'emily',
            datetime: '1:32pm',
          },
          {
            id: '4',
            message:
              'Chupa chups soufflé danish. Cake chocolate brownie cookie bear claw soufflé. Muffin chupa chups sweet caramels jelly beans chocolate bar bonbon liquorice.',
            nickname: 'bartek',
            datetime: '1:32pm',
          },
        ]}
        user={'holmes'}
      />,
    );

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        onLayout={[Function]}
        style={
          Object {
            "backgroundColor": "white",
            "flex": 1,
            "flexDirection": "column",
            "justifyContent": "flex-end",
          }
        }
      >
        <RCTScrollView
          collapsable={false}
          data={
            Array [
              Object {
                "datetime": "1:30pm",
                "id": "1",
                "message": "Brownie powder marshmallow dessert carrot cake marzipan cake caramels. Muffin topping wafer jelly apple pie candy. Fruitcake chocolate pudding fruitcake candy lemon drops chocolate.",
                "nickname": "holmes",
              },
              Object {
                "datetime": "1:32pm",
                "id": "2",
                "message": "Bear claw bear claw donut marzipan chocolate cake sugar plum pie. Chocolate cake chocolate bar ice cream. Marzipan powder brownie muffin jelly beans. Sesame snaps tootsie roll macaroon donut.",
                "nickname": "holmes",
              },
              Object {
                "datetime": "1:32pm",
                "id": "3",
                "message": "Marshmallows!",
                "nickname": "emily",
              },
              Object {
                "datetime": "1:32pm",
                "id": "4",
                "message": "Chupa chups soufflé danish. Cake chocolate brownie cookie bear claw soufflé. Muffin chupa chups sweet caramels jelly beans chocolate bar bonbon liquorice.",
                "nickname": "bartek",
              },
            ]
          }
          disableVirtualization={false}
          getItem={[Function]}
          getItemCount={[Function]}
          horizontal={false}
          initialNumToRender={10}
          keyExtractor={[Function]}
          maxToRenderPerBatch={10}
          onContentSizeChange={[Function]}
          onEndReachedThreshold={2}
          onGestureHandlerEvent={[Function]}
          onGestureHandlerStateChange={[Function]}
          onLayout={[Function]}
          onMomentumScrollEnd={[Function]}
          onScroll={[Function]}
          onScrollBeginDrag={[Function]}
          onScrollEndDrag={[Function]}
          removeClippedSubviews={false}
          renderItem={[Function]}
          renderScrollComponent={[Function]}
          scrollEventThrottle={50}
          stickyHeaderIndices={Array []}
          style={
            Object {
              "paddingLeft": 20,
              "paddingRight": 20,
            }
          }
          updateCellsBatchingPeriod={50}
          viewabilityConfigCallbackPairs={Array []}
          windowSize={21}
        >
          <View>
            <View
              onLayout={[Function]}
              style={null}
            >
              <View
                onLayout={[Function]}
                style={
                  Array [
                    Object {
                      "flex": 1,
                    },
                    Object {
                      "paddingBottom": 0,
                    },
                  ]
                }
              >
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
                        "alignItems": "center",
                        "flex": 1,
                        "paddingRight": 12,
                        "paddingTop": 5,
                      }
                    }
                  >
                    <Image
                      source={
                        Object {
                          "testUri": "../../../assets/icons/avatar.png",
                        }
                      }
                      style={
                        Object {
                          "borderRadius": 5,
                          "height": 32,
                          "resizeMode": "cover",
                          "width": 32,
                        }
                      }
                    />
                  </View>
                  <View
                    style={
                      Object {
                        "flex": 10,
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
                          holmes
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
                          1:30pm
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
                        Brownie powder marshmallow dessert carrot cake marzipan cake caramels. Muffin topping wafer jelly apple pie candy. Fruitcake chocolate pudding fruitcake candy lemon drops chocolate.
                      </Text>
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
                onLayout={[Function]}
                style={
                  Array [
                    Object {
                      "flex": 1,
                    },
                    Object {
                      "paddingBottom": 0,
                    },
                  ]
                }
              >
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
                        "alignItems": "center",
                        "flex": 1,
                        "paddingRight": 12,
                        "paddingTop": 5,
                      }
                    }
                  >
                    <Image
                      source={
                        Object {
                          "testUri": "../../../assets/icons/avatar.png",
                        }
                      }
                      style={
                        Object {
                          "borderRadius": 5,
                          "height": 32,
                          "resizeMode": "cover",
                          "width": 32,
                        }
                      }
                    />
                  </View>
                  <View
                    style={
                      Object {
                        "flex": 10,
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
                          holmes
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
                          1:32pm
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
                        Bear claw bear claw donut marzipan chocolate cake sugar plum pie. Chocolate cake chocolate bar ice cream. Marzipan powder brownie muffin jelly beans. Sesame snaps tootsie roll macaroon donut.
                      </Text>
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
                onLayout={[Function]}
                style={
                  Array [
                    Object {
                      "flex": 1,
                    },
                    Object {
                      "paddingBottom": 0,
                    },
                  ]
                }
              >
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
                        "alignItems": "center",
                        "flex": 1,
                        "paddingRight": 12,
                        "paddingTop": 5,
                      }
                    }
                  >
                    <Image
                      source={
                        Object {
                          "testUri": "../../../assets/icons/avatar.png",
                        }
                      }
                      style={
                        Object {
                          "borderRadius": 5,
                          "height": 32,
                          "resizeMode": "cover",
                          "width": 32,
                        }
                      }
                    />
                  </View>
                  <View
                    style={
                      Object {
                        "flex": 10,
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
                          emily
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
                          1:32pm
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
                        Marshmallows!
                      </Text>
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
                onLayout={[Function]}
                style={
                  Array [
                    Object {
                      "flex": 1,
                    },
                    Object {
                      "paddingBottom": 0,
                    },
                  ]
                }
              >
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
                        "alignItems": "center",
                        "flex": 1,
                        "paddingRight": 12,
                        "paddingTop": 5,
                      }
                    }
                  >
                    <Image
                      source={
                        Object {
                          "testUri": "../../../assets/icons/avatar.png",
                        }
                      }
                      style={
                        Object {
                          "borderRadius": 5,
                          "height": 32,
                          "resizeMode": "cover",
                          "width": 32,
                        }
                      }
                    />
                  </View>
                  <View
                    style={
                      Object {
                        "flex": 10,
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
                          bartek
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
                          1:32pm
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
                        Chupa chups soufflé danish. Cake chocolate brownie cookie bear claw soufflé. Muffin chupa chups sweet caramels jelly beans chocolate bar bonbon liquorice.
                      </Text>
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
              "paddingBottom": 20,
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
                    "borderColor": "#B3B3B3",
                    "borderRadius": 4,
                    "borderWidth": 1,
                    "flexGrow": 1,
                    "maxHeight": 72,
                    "minHeight": 42,
                    "paddingLeft": 15,
                    "paddingRight": 15,
                  },
                  Object {},
                ]
              }
            >
              <TextInput
                allowFontScaling={true}
                onChangeText={[Function]}
                placeholder="Message #Zbay as @holmes"
                rejectResponderTermination={true}
                style={
                  Array [
                    Object {
                      "paddingBottom": 8,
                      "paddingTop": 8,
                      "textAlignVertical": "center",
                    },
                  ]
                }
                underlineColorAndroid="transparent"
              />
            </View>
          </View>
        </View>
      </View>
    `);
  });
});

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { CreateCommunity } from './CreateCommunity.component'

describe('Spinner component', () => {
  it('renders component', () => {
    const { toJSON } = renderComponent(
      <CreateCommunity createCommunityAction={jest.fn()} redirectionAction={jest.fn()} />
    )
    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          Object {
            "backgroundColor": "#ffffff",
            "flex": 1,
          }
        }
      >
        <View
          onLayout={[Function]}
          style={
            Object {
              "flex": 1,
              "justifyContent": "center",
              "paddingLeft": 20,
              "paddingRight": 20,
            }
          }
        >
          <Text
            color="main"
            fontSize={24}
            fontWeight="medium"
            horizontalTextAlign="left"
            style={
              Array [
                Object {
                  "color": "#000000",
                  "fontFamily": "Rubik-Medium",
                  "fontSize": 24,
                  "textAlign": "left",
                  "textAlignVertical": "center",
                },
                Object {
                  "marginBottom": 30,
                },
              ]
            }
            verticalTextAlign="center"
          >
            Create a community
          </Text>
          <View>
            <Text
              color="main"
              fontSize={10}
              horizontalTextAlign="left"
              style={
                Array [
                  Object {
                    "color": "#000000",
                    "fontFamily": "Rubik-Regular",
                    "fontSize": 10,
                    "textAlign": "left",
                    "textAlignVertical": "center",
                  },
                  Object {
                    "paddingBottom": 10,
                  },
                ]
              }
              verticalTextAlign="center"
            >
              Add a name for your community
            </Text>
            <View
              accessibilityState={
                Object {
                  "disabled": false,
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
                onChangeText={[Function]}
                placeholder="Community name"
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
          <View
            style={
              Object {
                "marginTop": 32,
              }
            }
          >
            <View
              style={
                Object {
                  "alignItems": "flex-start",
                  "display": "flex",
                  "flex": 1,
                  "flexDirection": "row",
                  "flexWrap": "wrap",
                  "minHeight": 500,
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
                You
              </Text>
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
                 
              </Text>
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
                can
              </Text>
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
                 
              </Text>
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
                <Text
                  color="link"
                  fontSize={14}
                  horizontalTextAlign="left"
                  onPress={[Function]}
                  style={
                    Array [
                      Object {
                        "color": "#67BFD3",
                        "fontFamily": "Rubik-Regular",
                        "fontSize": 14,
                        "textAlign": "left",
                        "textAlignVertical": "center",
                      },
                    ]
                  }
                  verticalTextAlign="center"
                >
                  join a community
                </Text>
              </Text>
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
                 
              </Text>
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
                instead
              </Text>
            </View>
          </View>
          <View
            style={
              Object {
                "marginTop": 32,
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
                  "alignItems": "center",
                  "backgroundColor": "#521C74",
                  "borderRadius": 5,
                  "justifyContent": "center",
                  "marginVertical": 12,
                  "minHeight": 45,
                  "paddingVertical": 12,
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
                Continue
              </Text>
            </View>
          </View>
        </View>
      </View>
    `)
  })
})

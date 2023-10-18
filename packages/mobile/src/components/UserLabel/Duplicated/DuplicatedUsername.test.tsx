import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import DuplicatedUsernameComponent from './DuplicatedUsername.component'

describe('DuplicatedUsername component', () => {
  it('renders component', () => {
    const { toJSON } = renderComponent(<DuplicatedUsernameComponent handleBackButton={function (): void {}} />)
    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          {
            "backgroundColor": "#ffffff",
            "flex": 1,
          }
        }
        testID="duplicated-username-component"
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
                      "testUri": "../../../assets/icons/icon_close.png",
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
              Warning!
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
              "alignItems": "center",
              "marginTop": 10,
              "padding": 20,
            }
          }
        >
          <Image
            source={
              {
                "testUri": "../../../assets/icons/exclamationMark.png",
              }
            }
            style={
              {
                "height": 83,
                "width": 96,
              }
            }
          />
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
                  "marginBottom": 24,
                  "marginTop": 24,
                },
              ]
            }
            verticalTextAlign="center"
          >
            Multiple users with same name
          </Text>
          <Text
            color="main"
            fontSize={14}
            horizontalTextAlign="left"
            style={
              [
                {
                  "color": "#000000",
                  "fontFamily": "Rubik-Regular",
                  "fontSize": 14,
                  "textAlign": "left",
                  "textAlignVertical": "center",
                },
                {
                  "textAlign": "center",
                },
              ]
            }
            verticalTextAlign="center"
          >
            An unregistered user is using the same name as another user. This should be rare, and could mean someone is impersonating another user.
          </Text>
          <View
            style={
              {
                "flexDirection": "row",
                "marginTop": 24,
              }
            }
          >
            <Text
              color="main"
              fontSize={14}
              horizontalTextAlign="left"
              style={
                [
                  {
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
              These users will be marked
            </Text>
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
                  "marginLeft": 8,
                }
              }
              testID="user-label"
            >
              <View
                style={
                  {
                    "backgroundColor": "#E42656",
                    "borderRadius": 8,
                    "cursor": "pointer",
                    "flexDirection": "row",
                    "paddingBottom": 3,
                    "paddingLeft": 8,
                    "paddingRight": 8,
                    "paddingTop": 3,
                  }
                }
              >
                <Image
                  source={
                    {
                      "testUri": "../../../assets/icons/warning-icon.png",
                    }
                  }
                  style={
                    {
                      "height": 12,
                      "marginLeft": 4,
                      "marginRight": 4,
                      "width": 13,
                    }
                  }
                />
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
                      {
                        "color": "white",
                      },
                    ]
                  }
                  verticalTextAlign="center"
                >
                  Duplicate
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    `)
  })
})

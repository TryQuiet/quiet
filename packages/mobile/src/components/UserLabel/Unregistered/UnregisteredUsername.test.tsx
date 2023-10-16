import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import UnregisteredUsernameComponent from './UnregisteredUsername.component'

describe('UnregisteredUsername component', () => {
  it('renders component', () => {
    const { toJSON } = renderComponent(
      <UnregisteredUsernameComponent handleBackButton={function (): void {}} username={'johnny'} />
    )
    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          {
            "backgroundColor": "#ffffff",
            "flex": 1,
          }
        }
        testID="unregistered-username-component"
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
              Unregistered username
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
              "padding": 20,
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
                {
                  "textAlign": "center",
                },
              ]
            }
            verticalTextAlign="center"
          >
            The username @
            johnny
             has not been registered yet with the community owner, so it’s still possible for someone else to register the same username. When the community owner is online, @
            johnny
             will be registered automatically and this alert will go away.
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
                "alignItems": "center",
                "backgroundColor": "#521C74",
                "borderRadius": 8,
                "justifyContent": "center",
                "marginVertical": 12,
                "minHeight": 45,
                "paddingVertical": 12,
                "width": 50,
              }
            }
            testID="button"
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
              OK
            </Text>
          </View>
        </View>
      </View>
    `)
  })
})

import React from 'react'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import PossibleImpersonationAttackComponent from './PossibleImpersonationAttack.component'

describe('PossibleImpersonationAttack component', () => {
  it('renders properly', () => {
    const { toJSON } = renderComponent(
      <PossibleImpersonationAttackComponent
        communityName={'dev'}
        handleBackButton={() => {}}
        leaveCommunity={() => {}}
      />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          {
            "backgroundColor": "#ffffff",
            "flex": 1,
          }
        }
        testID="possible-impersonation-attack-component"
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
                  "marginTop": 32,
                },
              ]
            }
            verticalTextAlign="center"
          >
            Possible impersonation attack
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
                  "lineHeight": 20,
                  "textAlign": "center",
                },
              ]
            }
            verticalTextAlign="center"
          >
            The owner of
             
            <Text
              color="main"
              fontSize={14}
              fontWeight="medium"
              horizontalTextAlign="left"
              style={
                [
                  {
                    "color": "#000000",
                    "fontFamily": "Rubik-Medium",
                    "fontSize": 14,
                    "textAlign": "left",
                    "textAlignVertical": "center",
                  },
                ]
              }
              verticalTextAlign="center"
            >
              dev
            </Text>
             
            has registered an invalid username. Either something is very broken, the community owner is trying to impersonate other users, or the community owner has been hacked.
          </Text>
          <Text
            color="main"
            fontSize={14}
            fontWeight="bold"
            horizontalTextAlign="left"
            style={
              [
                {
                  "color": "#000000",
                  "fontFamily": "Rubik-Bold",
                  "fontSize": 14,
                  "textAlign": "left",
                  "textAlignVertical": "center",
                },
                {
                  "lineHeight": 20,
                  "marginBottom": 16,
                  "textAlign": "center",
                },
              ]
            }
            verticalTextAlign="center"
          >
            This should never happen and we recommend leaving this community immediately!
          </Text>
        </View>
      </View>
    `)
  })
})

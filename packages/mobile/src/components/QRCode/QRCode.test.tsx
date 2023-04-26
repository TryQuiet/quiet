import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'

import { QRCode } from './QRCode.component'

describe('QRCode component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <QRCode
        value={'https://tryquiet.org/join#'}
        shareCode={jest.fn()}
        handleBackButton={jest.fn()}
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
      >
        <View
          style={
            [
              {
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
                "justifyContent": "center",
                "width": 64,
              }
            }
            testID="appbar_action_item"
          >
            <Image
              resizeMethod="resize"
              resizeMode="cover"
              source={
                {
                  "testUri": "../../../assets/icons/arrow_left.png",
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
          <View
            style={
              {
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
              QR Code
            </Text>
          </View>
          <View
            style={
              {
                "width": 64,
              }
            }
          />
        </View>
        <View
          style={
            {
              "alignItems": "center",
              "display": "flex",
              "flexDirection": "column",
              "padding": 16,
            }
          }
        >
          <View
            style={
              {
                "margin": 16,
              }
            }
          />
          <View
            style={
              {
                "marginTop": 16,
                "width": 340,
              }
            }
          >
            <Text
              color="main"
              fontSize={14}
              fontWeight="normal"
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
              This community QR code is private. If it is shared with someone, they can scan it with their camera to join this community.
            </Text>
          </View>
          <View
            style={
              {
                "marginTop": 16,
                "width": 124,
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
                  "borderRadius": 5,
                  "justifyContent": "center",
                  "marginVertical": 12,
                  "minHeight": 45,
                  "paddingVertical": 12,
                  "width": undefined,
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
                Share code
              </Text>
            </View>
          </View>
        </View>
      </View>
    `)
  })
})

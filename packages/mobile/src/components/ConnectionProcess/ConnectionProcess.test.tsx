import { ConnectionProcessInfo } from '@quiet/types'
import React from 'react'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import ConnectionProcessComponent from './ConnectionProcess.component'

describe('ConnectionProcessComponent', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <ConnectionProcessComponent
        connectionProcess={{ number: 40, text: ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE }}
        openUrl={jest.fn()}
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
        testID="connection-process-component"
      >
        <View
          style={
            {
              "alignItems": "center",
              "display": "flex",
              "flexDirection": "column",
              "height": "100%",
              "justifyContent": "center",
              "padding": "10%",
              "width": "100%",
            }
          }
        >
          <Image
            collapsable={false}
            source={
              {
                "testUri": "../../../assets/icons/join-community.png",
              }
            }
            style={
              {
                "height": 120,
                "transform": [
                  {
                    "rotate": "0deg",
                  },
                ],
                "width": 120,
              }
            }
          />
          <Text
            color="main"
            fontSize={18}
            fontWeight="medium"
            horizontalTextAlign="left"
            style={
              [
                {
                  "color": "#000000",
                  "fontFamily": "Rubik-Medium",
                  "fontSize": 18,
                  "textAlign": "left",
                  "textAlignVertical": "center",
                },
                {
                  "marginBottom": 16,
                  "marginTop": 24,
                },
              ]
            }
            testID="connection-process-title"
            verticalTextAlign="center"
          >
            Joining now!
          </Text>
          <View
            style={
              {
                "backgroundColor": "#F0F0F0",
                "borderRadius": 4,
                "height": 4,
                "width": 300,
              }
            }
          >
            <View
              style={
                {
                  "backgroundColor": "#67BFD3",
                  "borderRadius": 4,
                  "height": 4,
                  "width": 120,
                }
              }
            />
          </View>
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
                  "marginTop": 8,
                  "textAlign": "center",
                },
              ]
            }
            testID="connection-process-text"
            verticalTextAlign="center"
          >
            Spawning hidden service for community
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
                  "marginTop": 40,
                  "textAlign": "center",
                },
              ]
            }
            verticalTextAlign="center"
          >
            You can exit the app - we'll notify you once you're connected!
          </Text>
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
                {
                  "lineHeight": 20,
                  "textAlign": "center",
                },
              ]
            }
            verticalTextAlign="center"
          >
            This first time might take 30 seconds, 10 minutes, or even longer.
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
                  "marginTop": 25,
                  "textAlign": "center",
                },
              ]
            }
            verticalTextAlign="center"
          >
            There's a good reason why it's slow: Quiet stores data on your community’s devices (not Big Tech’s servers!) and uses the battle-tested privacy tool Tor to protect your information. Tor is fast once connected, but can take a long time to connect at first.
          </Text>
          <Text
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
            color="main"
            focusable={true}
            fontSize={14}
            horizontalTextAlign="left"
            onClick={[Function]}
            onResponderGrant={[Function]}
            onResponderMove={[Function]}
            onResponderRelease={[Function]}
            onResponderTerminate={[Function]}
            onResponderTerminationRequest={[Function]}
            onStartShouldSetResponder={[Function]}
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
                  "color": "#2373EA",
                  "lineHeight": 20,
                  "marginTop": 40,
                  "textAlign": "center",
                },
              ]
            }
            testID="learn-more-link"
            verticalTextAlign="center"
          >
            Learn more about Tor and Quiet
          </Text>
        </View>
      </View>
    `)
  })
})

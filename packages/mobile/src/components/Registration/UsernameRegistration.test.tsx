import React from 'react'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { UsernameRegistration } from './UsernameRegistration.component'
import { UsernameVariant } from './UsernameRegistration.types'

describe('UsernameRegistration', () => {
  it('UsernameVariant.NEW,', () => {
    const { toJSON } = renderComponent(
      <UsernameRegistration
        variant={UsernameVariant.NEW}
        registerUsernameAction={jest.fn()}
        usernameRegistered={false}
        fetching={false}
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
        testID="username-registration-component"
      >
        <View
          onLayout={[Function]}
          style={
            {
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
              [
                {
                  "color": "#000000",
                  "fontFamily": "Rubik-Medium",
                  "fontSize": 24,
                  "textAlign": "left",
                  "textAlignVertical": "center",
                },
                {
                  "marginBottom": 30,
                },
              ]
            }
            verticalTextAlign="center"
          >
            Register a username
          </Text>
          <View>
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
                    "color": "#4C4C4C",
                    "paddingBottom": 10,
                  },
                ]
              }
              verticalTextAlign="center"
            >
              Choose your favorite username
            </Text>
            <View
              accessibilityState={
                {
                  "busy": undefined,
                  "checked": undefined,
                  "disabled": false,
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
              onBlur={[Function]}
              onClick={[Function]}
              onFocus={[Function]}
              onResponderGrant={[Function]}
              onResponderMove={[Function]}
              onResponderRelease={[Function]}
              onResponderTerminate={[Function]}
              onResponderTerminationRequest={[Function]}
              onStartShouldSetResponder={[Function]}
              round={false}
              style={
                [
                  {
                    "backgroundColor": "#ffffff",
                    "borderColor": "#C4C4C4",
                    "borderRadius": 4,
                    "borderWidth": 1,
                    "flexGrow": 1,
                    "height": 56,
                    "justifyContent": "center",
                    "paddingLeft": 16,
                    "paddingRight": 16,
                  },
                  {
                    "height": 54,
                  },
                ]
              }
            >
              <TextInput
                autoCapitalize="none"
                editable={true}
                height={54}
                maxLength={20}
                onChangeText={[Function]}
                onContentSizeChange={[Function]}
                placeholder="Enter a username"
                style={
                  [
                    {
                      "height": 54,
                      "paddingBottom": 12,
                      "paddingTop": 12,
                      "textAlignVertical": "center",
                    },
                  ]
                }
                testID="input"
              />
            </View>
            <Text
              color="hint"
              fontSize={14}
              horizontalTextAlign="left"
              style={
                [
                  {
                    "color": "#999999",
                    "fontFamily": "Rubik-Regular",
                    "fontSize": 14,
                    "textAlign": "left",
                    "textAlignVertical": "center",
                  },
                  {
                    "lineHeight": 16,
                    "paddingTop": 10,
                  },
                ]
              }
              verticalTextAlign="center"
            >
              Your username cannot have any spaces or special characters, must be lowercase letters and numbers only.
            </Text>
          </View>
          <View
            style={
              {
                "marginTop": 20,
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
                  "borderRadius": 8,
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
                Continue
              </Text>
            </View>
          </View>
        </View>
      </View>
    `)
  })

  it('UsernameVariant.TAKEN,', () => {
    const { toJSON } = renderComponent(
      <UsernameRegistration
        registerUsernameAction={jest.fn()}
        usernameRegistered={false}
        fetching={false}
        variant={UsernameVariant.TAKEN}
        handleBackButton={jest.fn()}
        currentUsername={'john'}
        registeredUsers={{
          'BCidRGCBqBPNGNrZ1oml99/qtHjZ6ZtliVzJPpReZk9YC6+aQ1zeooOlpyzv7rNG6nMX2R5ffaVkZZFgEMdNEBg=': {
            dmPublicKey:
              '1c63a0152f0b0221f96c80aab6777e2569d27a14e991dccd086e34cda1c55d9d6e898efdb9cb5a16d2f90b4155e34abf3261c84e76936ba0105929922feda1fb0615f3254cc56c056cb6144076d0cbdba67cf0fb6687a97d9bb6621bb6b38dcf08aa509f1164212118111f045edc5dab8d315d6e1241cdd10c40883ea420d10d560e48329e086154645035af0668e372a381fbd8aa0912f3581de34b50361cc31adf7a8e811504b6970c9093c058f0fb41ae27df64b09bcb13df84bd23d47a0024463cbb92ee917af3b77b168deb93f6da2d0d13a361969447e16bf249edd872b4797125fa86aad1ce35b1d6ee449359f31c9224a70997d0f0ca38c1f796cede660dd0bb3b1fc9ec251f896bc0aec1603ee8e1278c76d9d1e52adcfa0a06658d631486016efb3b5f44e0c3fb1ce4299834cdf05e',
            onionAddress: 'zpu47hphczcuyt3auu5pr2knvimf3adm76gt3g7zbspungjbm3tsy3ad.onion',
            peerId: 'QmPrgB2jSFvr7yP3vbLKMLW4JS9hoA9kj2fhN8VjE2NWvJ',
            username: 'owner',
          },
          'BJ50trLih9tvIznBAi69dLNpBV5YiQHCU610UfH3Qm9t3cki9QHWAAhvrfOX+763BH1fwqkOU3JsoBAEF1+USvM=': {
            dmPublicKey:
              '01161f217d3b372ddefe390b6aed6ada3f21c7ca0d2aacd125840d0c420030b5caec93fbcc1825bb19f38448c1573be814c827b3bce99f6d37b427044687b63799ce0cd7133a654eb2c5644405380399ed0b9140cf0f6d2937008929be8c8ad97cba64e08f7608bb54e0148c8bb30fd2c6df2b8d237cdbfe7ae3d300d896c0ce9e3c5006b687f2e573bedb68152db1954869c21243ef1557eb6d442138ad98e47285f5dd9475fac3a06d2972ae775bdc50d5ab59676d27367c15954b64b0b1a29083ac78934f3f1d0088b73389e29d84f61c60c321770550ecdffa9a24cf0c7fdd279974b5703ce105f22d683530c2f62b36945b3d97f88256f31e1146c3861993a989f5cd99bda647d8744068c3bb44eea407f33109c9c1a0f790f745a6ff2bfd45f5be741fc351549b11d54a4980c4d6d7afb4',
            onionAddress: 'lr5d3d64p4hx4mw3uue3ufews23jhl6bfqnsimt7j52igjqdv2zrmsyd.onion',
            peerId: 'QmWwMev68izPUKB1PGxkG3UHHXiappQQAnkvUwPSTzrUyy',
            username: 'johnny',
          },
        }}
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
        testID="username-registration-component"
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
              Username taken
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
          onLayout={[Function]}
          style={
            {
              "flex": 1,
              "justifyContent": "flex-start",
              "paddingLeft": 20,
              "paddingRight": 20,
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
                  "marginBottom": 30,
                  "marginTop": 30,
                },
              ]
            }
            verticalTextAlign="center"
          >
            We’re sorry, but the username
             
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
              @john
            </Text>
             was already claimed by someone else. Can you choose another name?
          </Text>
          <View>
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
                    "color": "#4C4C4C",
                    "paddingBottom": 10,
                  },
                ]
              }
              verticalTextAlign="center"
            >
              Enter a username
            </Text>
            <View
              accessibilityState={
                {
                  "busy": undefined,
                  "checked": undefined,
                  "disabled": false,
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
              onBlur={[Function]}
              onClick={[Function]}
              onFocus={[Function]}
              onResponderGrant={[Function]}
              onResponderMove={[Function]}
              onResponderRelease={[Function]}
              onResponderTerminate={[Function]}
              onResponderTerminationRequest={[Function]}
              onStartShouldSetResponder={[Function]}
              round={false}
              style={
                [
                  {
                    "backgroundColor": "#ffffff",
                    "borderColor": "#C4C4C4",
                    "borderRadius": 4,
                    "borderWidth": 1,
                    "flexGrow": 1,
                    "height": 56,
                    "justifyContent": "center",
                    "paddingLeft": 16,
                    "paddingRight": 16,
                  },
                  {
                    "height": 54,
                  },
                ]
              }
            >
              <TextInput
                autoCapitalize="none"
                editable={true}
                height={54}
                maxLength={20}
                onChangeText={[Function]}
                onContentSizeChange={[Function]}
                placeholder="Username"
                style={
                  [
                    {
                      "height": 54,
                      "paddingBottom": 12,
                      "paddingTop": 12,
                      "textAlignVertical": "center",
                    },
                  ]
                }
                testID="input"
              />
            </View>
            <Text
              color="hint"
              fontSize={14}
              horizontalTextAlign="left"
              style={
                [
                  {
                    "color": "#999999",
                    "fontFamily": "Rubik-Regular",
                    "fontSize": 14,
                    "textAlign": "left",
                    "textAlignVertical": "center",
                  },
                  {
                    "lineHeight": 16,
                    "paddingTop": 10,
                  },
                ]
              }
              verticalTextAlign="center"
            >
              Your username will be public, but you can choose any name you like. No spaces or special characters. Lowercase letters and numbers only. 
            </Text>
          </View>
          <View
            style={
              {
                "marginTop": 20,
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
                  "borderRadius": 8,
                  "justifyContent": "center",
                  "marginVertical": 12,
                  "minHeight": 45,
                  "paddingVertical": 12,
                  "width": 100,
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
                Continue
              </Text>
            </View>
          </View>
        </View>
      </View>
    `)
  })
})

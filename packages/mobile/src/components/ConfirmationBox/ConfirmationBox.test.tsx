import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'

import { ConfirmationBox } from './ConfirmationBox.component'
import { Platform } from 'react-native'

describe('ConfirmationBox component', () => {
  it('should match inline snapshot on android', () => {
    Platform.OS = 'android'
    const { toJSON } = renderComponent(<ConfirmationBox title={'Link copied!'} toggle />)

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        collapsable={false}
        style={
          {
            "alignItems": "center",
            "bottom": 35,
            "display": "flex",
            "opacity": 0,
            "padding": 40,
            "position": "absolute",
            "width": "100%",
          }
        }
      >
        <View
          style={
            {
              "alignItems": "center",
              "backgroundColor": "#000000",
              "borderRadius": 16,
              "display": "flex",
              "flexDirection": "column",
              "height": 84,
              "padding": 16,
              "width": 180,
            }
          }
        >
          <View
            style={
              {
                "flex": 1.5,
                "justifyContent": "center",
              }
            }
          >
            <Image
              resizeMethod="resize"
              resizeMode="cover"
              source={
                {
                  "testUri": "../../../assets/icons/icon_check_white.png",
                }
              }
              style={
                {
                  "height": 13,
                  "width": 13,
                }
              }
            />
          </View>
          <View
            style={
              {
                "flex": 1,
              }
            }
          >
            <Text
              color="white"
              fontSize={14}
              fontWeight="normal"
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
                  {
                    "lineHeight": 20,
                  },
                ]
              }
              verticalTextAlign="center"
            >
              Link copied!
            </Text>
          </View>
        </View>
      </View>
    `)
  })

  it('should match inline snapshot on ios', () => {
    Platform.OS = 'ios'
    const { toJSON } = renderComponent(<ConfirmationBox title={'Link copied!'} toggle />)

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        collapsable={false}
        style={
          {
            "alignItems": "center",
            "display": "flex",
            "height": "100%",
            "justifyContent": "center",
            "opacity": 0,
            "padding": 40,
            "position": "absolute",
            "width": "100%",
          }
        }
      >
        <View
          style={
            {
              "alignItems": "center",
              "backgroundColor": "#000000",
              "borderRadius": 16,
              "display": "flex",
              "flexDirection": "column",
              "height": 84,
              "padding": 16,
              "width": 180,
            }
          }
        >
          <View
            style={
              {
                "flex": 1.5,
                "justifyContent": "center",
              }
            }
          >
            <Image
              resizeMethod="resize"
              resizeMode="cover"
              source={
                {
                  "testUri": "../../../assets/icons/icon_check_white.png",
                }
              }
              style={
                {
                  "height": 13,
                  "width": 13,
                }
              }
            />
          </View>
          <View
            style={
              {
                "flex": 1,
              }
            }
          >
            <Text
              color="white"
              fontSize={14}
              fontWeight="normal"
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
                  {
                    "lineHeight": 20,
                  },
                ]
              }
              verticalTextAlign="center"
            >
              Link copied!
            </Text>
          </View>
        </View>
      </View>
    `)
  })
})

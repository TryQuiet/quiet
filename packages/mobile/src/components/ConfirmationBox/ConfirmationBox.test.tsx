import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'

import { ConfirmationBox } from './ConfirmationBox.component'

describe('ConfirmationBox component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(<ConfirmationBox title={'Link copied!'} toggle />)

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        collapsable={false}
        style={
          Object {
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
            Object {
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
              Object {
                "flex": 1.5,
                "justifyContent": "center",
              }
            }
          >
            <Image
              resizeMethod="resize"
              resizeMode="cover"
              source={
                Object {
                  "testUri": "../../../assets/icons/icon_check_white.png",
                }
              }
              style={
                Object {
                  "height": 13,
                  "width": 13,
                }
              }
            />
          </View>
          <View
            style={
              Object {
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
                Array [
                  Object {
                    "color": "#ffffff",
                    "fontFamily": "Rubik-Regular",
                    "fontSize": 14,
                    "textAlign": "left",
                    "textAlignVertical": "center",
                  },
                  Object {
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

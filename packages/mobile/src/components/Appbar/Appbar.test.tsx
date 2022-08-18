import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Appbar } from './Appbar.component'

describe('Appbar component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(<Appbar />)

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          Array [
            Object {
              "backgroundColor": "#ffffff",
              "borderBottomColor": "#E5E5E5",
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
              "flex": 2,
              "justifyContent": "center",
            }
          }
        >
          <Image
            resizeMethod="resize"
            resizeMode="cover"
            source={
              Object {
                "testUri": "../../../assets/icons/arrow_left.png",
              }
            }
            style={
              Object {
                "height": 16,
                "width": 16,
              }
            }
          />
        </View>
        <View
          style={
            Object {
              "alignItems": "center",
              "flex": 8,
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
          />
        </View>
        <View
          style={
            Object {
              "flex": 2,
            }
          }
        />
      </View>
    `)
  })
})

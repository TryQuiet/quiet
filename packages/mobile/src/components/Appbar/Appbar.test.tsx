import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Appbar } from './Appbar.component'

describe('Appbar component', () => {
  it('renders for channel', () => {
    const { toJSON } = renderComponent(<Appbar title={'general'} prefix={'#'} back={() => {}} />)

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          Array [
            Object {
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
              "justifyContent": "center",
              "width": 64,
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
          >
            general
          </Text>
        </View>
        <View
          style={
            Object {
              "width": 64,
            }
          }
        />
      </View>
    `)
  })

  it('renders for community', () => {
    const { toJSON } = renderComponent(<Appbar title={'quiet'} position={'flex-start'} />)

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          Array [
            Object {
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
              "justifyContent": "center",
              "width": 64,
            }
          }
        >
          <View
            style={
              Object {
                "alignItems": "center",
                "backgroundColor": "#67BFD3",
                "borderRadius": 4,
                "height": 36,
                "justifyContent": "center",
                "width": 36,
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
              qu
            </Text>
          </View>
        </View>
        <View
          style={
            Object {
              "alignItems": "flex-start",
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
          >
            quiet
          </Text>
        </View>
        <View
          style={
            Object {
              "width": 64,
            }
          }
        />
      </View>
    `)
  })
})

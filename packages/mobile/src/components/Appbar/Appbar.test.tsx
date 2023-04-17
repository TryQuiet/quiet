import React from 'react'

import { useContextMenu } from '../../hooks/useContextMenu'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Appbar } from './Appbar.component'

describe('Appbar component', () => {
  it('renders for channel', () => {
    const { toJSON } = renderComponent(<Appbar title={'general'} prefix={'#'} back={() => {}} />)

    expect(toJSON()).toMatchInlineSnapshot(`
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
            general
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
    `)
  })

  it('renders for community', () => {
    const contextMenu: ReturnType<typeof useContextMenu> = {
      visible: false,
      handleOpen: undefined,
      handleClose: undefined
    }

    const { toJSON } = renderComponent(
      <Appbar title={'quiet'} position={'flex-start'} contextMenu={contextMenu} />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
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
        >
          <View
            style={
              {
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
              qu
            </Text>
          </View>
        </View>
        <View
          style={
            {
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
            quiet
          </Text>
        </View>
        <View
          style={
            {
              "width": 64,
            }
          }
        />
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
        >
          <Image
            resizeMethod="resize"
            resizeMode="contain"
            source={
              {
                "testUri": "../../../assets/icons/dots.png",
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
    `)
  })
})

import React from 'react'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'

import { Loading } from './Loading.component'

describe('Loading component', () => {
    it('should match inline snapshot', () => {
        const { toJSON } = renderComponent(
            <Loading
                title={'Creating community “Disco-fever”'}
                caption={'Additional info if needed can go here otherwise this is hidden.'}
            />
        )

        expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          {
            "alignItems": "center",
            "flex": 1,
            "justifyContent": "center",
          }
        }
      >
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
                "width": 220,
              }
            }
          />
        </View>
        <View
          style={
            {
              "flexDirection": "column",
              "gap": 8,
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
                  "lineHeight": 20,
                  "marginTop": 8,
                  "textAlign": "center",
                },
              ]
            }
            verticalTextAlign="center"
          >
            Creating community “Disco-fever”
          </Text>
          <View
            style={
              {
                "width": 250,
              }
            }
          >
            <Text
              color="gray50"
              fontSize={12}
              horizontalTextAlign="center"
              style={
                [
                  {
                    "color": "#7F7F7F",
                    "fontFamily": "Rubik-Regular",
                    "fontSize": 12,
                    "textAlign": "center",
                    "textAlignVertical": "center",
                  },
                ]
              }
              verticalTextAlign="center"
            >
              Additional info if needed can go here otherwise this is hidden.
            </Text>
          </View>
        </View>
      </View>
    `)
    })
})

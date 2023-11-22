import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Typography } from './Typography.component'

describe('Typography component', () => {
    it('should match inline snapshot', () => {
        const { toJSON } = renderComponent(
            <Typography color={'main'} fontSize={20} fontWeight={'bold'}>
                {'Typography'}
            </Typography>
        )

        expect(toJSON()).toMatchInlineSnapshot(`
      <Text
        color="main"
        fontSize={20}
        fontWeight="bold"
        horizontalTextAlign="left"
        style={
          [
            {
              "color": "#000000",
              "fontFamily": "Rubik-Bold",
              "fontSize": 20,
              "textAlign": "left",
              "textAlignVertical": "center",
            },
          ]
        }
        verticalTextAlign="center"
      >
        Typography
      </Text>
    `)
    })
})

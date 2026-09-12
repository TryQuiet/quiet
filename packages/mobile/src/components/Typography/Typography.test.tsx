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
          {
            "color": "#000000",
            "fontFamily": "Rubik-Bold",
            "fontSize": 20,
            "textAlign": "left",
            "textAlignVertical": "center",
          }
        }
        verticalTextAlign="center"
      >
        Typography
      </Text>
    `)
  })

  it('resolves size, line height and weight from a type-scale variant', () => {
    const { toJSON } = renderComponent(<Typography variant={'title'}>{'Typography'}</Typography>)

    expect(toJSON()).toMatchInlineSnapshot(`
      <Text
        color="main"
        fontSize={20}
        fontWeight="medium"
        horizontalTextAlign="left"
        lineHeight={28}
        style={
          {
            "color": "#000000",
            "fontFamily": "Rubik-Medium",
            "fontSize": 20,
            "lineHeight": 28,
            "textAlign": "left",
            "textAlignVertical": "center",
          }
        }
        verticalTextAlign="center"
      >
        Typography
      </Text>
    `)
  })

  it('lets an explicit size override the variant', () => {
    const { toJSON } = renderComponent(
      <Typography variant={'body'} fontSize={13}>
        {'Typography'}
      </Typography>
    )

    expect(toJSON()).toMatchInlineSnapshot(`
      <Text
        color="main"
        fontSize={13}
        fontWeight="normal"
        horizontalTextAlign="left"
        lineHeight={20}
        style={
          {
            "color": "#000000",
            "fontFamily": "Rubik-Regular",
            "fontSize": 13,
            "lineHeight": 20,
            "textAlign": "left",
            "textAlignVertical": "center",
          }
        }
        verticalTextAlign="center"
      >
        Typography
      </Text>
    `)
  })
})

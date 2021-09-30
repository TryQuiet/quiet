import React from 'react'

import each from 'jest-each'

import { renderComponent } from '../../../testUtils/renderComponent'
import { Snackbar } from './Snackbar'

describe('Snackbar', () => {
  each(['success', 'warning', 'error', 'info', 'loading']).test('renders %s', variant => {
    const result = renderComponent(
      <Snackbar open message='test snackbar' variant={variant} onClose={jest.fn()} />
    )
    expect(result.baseElement).toMatchSnapshot()
  })

  each([
    ['top', 'left'],
    ['top', 'right'],
    ['bottom', 'left'],
    ['top', 'right']
  ]).test('renders full width for position [%s, %s]', (vertical, horizontal) => {
    const result = renderComponent(
      <Snackbar
        open
        message='test snackbar'
        variant='success'
        position={{ vertical, horizontal }}
        fullWidth
        onClose={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchSnapshot()
  })

  it('renders closed', () => {
    const result = renderComponent(
      <Snackbar open={false} message='test snackbar' variant='success' onClose={jest.fn()} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div />
      </body>
    `)
  })
})

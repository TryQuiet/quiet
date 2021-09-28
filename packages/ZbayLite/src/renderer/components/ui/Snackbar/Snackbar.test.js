import React from 'react'

import { shallow } from 'enzyme'

import { Snackbar } from './Snackbar'

import each from 'jest-each'

describe('Snackbar', () => {
  each(['success', 'warning', 'error', 'info', 'loading']).test('renders %s', variant => {
    const result = shallow(
      <Snackbar open message='test snackbar' variant={variant} onClose={jest.fn()} />
    )
    expect(result).toMatchSnapshot()
  })

  each([
    ['top', 'left'],
    ['top', 'right'],
    ['bottom', 'left'],
    ['top', 'right']
  ]).test('renders full width for position [%s, %s]', (vertical, horizontal) => {
    const result = shallow(
      <Snackbar
        open
        message='test snackbar'
        variant='success'
        position={{ vertical, horizontal }}
        fullWidth
        onClose={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders closed', () => {
    const result = shallow(
      <Snackbar open={false} message='test snackbar' variant='success' onClose={jest.fn()} />
    )
    expect(result).toMatchSnapshot()
  })
})

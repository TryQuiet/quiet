import React from 'react'
import { shallow } from 'enzyme'
import each from 'jest-each'

import { SnackbarContent } from './SnackbarContent'

describe('SnackbarContent', () => {
  each(['success', 'warning', 'error', 'info', 'loading']).test('renders %s', variant => {
    const result = shallow(
      <SnackbarContent message='test snackbar' variant={variant} onClose={jest.fn()} />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders fullWidth', () => {
    const result = shallow(
      <SnackbarContent message='test snackbar' variant='success' onClose={jest.fn()} fullWidth />
    )
    expect(result).toMatchSnapshot()
  })
})

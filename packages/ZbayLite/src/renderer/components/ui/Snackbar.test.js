/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../shared/testing/mocks'
import { Snackbar } from './Snackbar'

describe('Snackbar', () => {
  each(['success', 'warning', 'error', 'info', 'loading']).test(
    'renders %s',
    (variant) => {
      const result = shallow(
        <Snackbar
          classes={mockClasses}
          variant={variant}
          open
          onClose={jest.fn()}
          message='test snackbar'
        />
      )
      expect(result).toMatchSnapshot()
    }
  )

  each([
    ['top', 'left'],
    ['top', 'right'],
    ['bottom', 'left'],
    ['top', 'right']
  ]).test(
    'renders full width for position [%s, %s]',
    (vertical, horizontal) => {
      const result = shallow(
        <Snackbar
          classes={mockClasses}
          variant='success'
          open
          position={{ vertical, horizontal }}
          fullWidth
          onClose={jest.fn()}
          message='test snackbar'
        />
      )
      expect(result).toMatchSnapshot()
    }
  )

  it('renders closed', () => {
    const result = shallow(
      <Snackbar
        classes={mockClasses}
        variant='success'
        open={false}
        onClose={jest.fn()}
        message='test snackbar'
      />
    )
    expect(result).toMatchSnapshot()
  })
})

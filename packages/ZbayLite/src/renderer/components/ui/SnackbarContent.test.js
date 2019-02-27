/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { SnackbarContent } from './SnackbarContent'
import { mockClasses } from '../../../shared/testing/mocks'

describe('SnackbarContent', () => {
  each(['success', 'warning', 'error', 'info', 'loading']).test(
    'renders %s',
    (variant) => {
      const result = shallow(
        <SnackbarContent
          variant={variant}
          message='test snackbar'
          onClose={jest.fn()}
          classes={mockClasses}
        />
      )
      expect(result).toMatchSnapshot()
    }
  )

  it('renders fullWidth', () => {
    const result = shallow(
      <SnackbarContent
        variant='success'
        message='test snackbar'
        onClose={jest.fn()}
        classes={mockClasses}
        fullWidth
      />
    )
    expect(result).toMatchSnapshot()
  })
})

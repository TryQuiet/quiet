/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { ErrorModal } from './ErrorModal'
import { mockClasses } from '../../../shared/testing/mocks'

describe('ErrorModal', () => {
  it('renders component', () => {
    const result = shallow(
      <ErrorModal
        open
        classes={mockClasses}
        message='Test error message'
        traceback='Error: Test error message, error traceback'
        handleExit={jest.fn()}
        handleCopy={jest.fn()}
        restartApp={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { SpinnerLoader } from './SpinnerLoader'
import { mockClasses } from '../../../shared/testing/mocks'

describe('SpinnerLoader', () => {
  it('renders component', () => {
    const result = shallow(
      <SpinnerLoader
        classes={mockClasses}
        message='Test loading message'
        className='test-class-name'
      />
    )
    expect(result).toMatchSnapshot()
  })
})

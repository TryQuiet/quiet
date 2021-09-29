/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { SpinnerLoader } from './SpinnerLoader'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('SpinnerLoader', () => {
  /* Skipping test because it can't be verified correctly without wrapping component (MuiThemeProvider),
     which cannot be applied using enzyme library - waiting for @testing-library/react to be introduced */
  it.skip('renders component', () => {
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

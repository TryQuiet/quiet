/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../shared/testing/mocks'
import { LoadingButton } from './LoadingButton'

describe('Loading button', () => {
  it('renders component', () => {
    const props = {
      inProgress: false
    }
    const result = shallow(
      <LoadingButton
        classes={mockClasses}
        props={props}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

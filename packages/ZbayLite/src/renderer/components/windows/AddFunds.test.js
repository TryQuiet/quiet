import React from 'react'
import { shallow } from 'enzyme'

import { AddFunds } from './AddFunds'
import { mockClasses } from '../../../shared/testing/mocks'

describe('AddFunds', () => {
  it('renders component', () => {
    const result = shallow(
      <AddFunds classes={mockClasses} openModal={jest.fn()} skip={jest.fn()} />
    )
    expect(result).toMatchSnapshot()
  })
})

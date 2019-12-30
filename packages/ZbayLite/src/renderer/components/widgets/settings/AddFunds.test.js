import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'
import { AddFunds } from './AddFunds'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('AddFunds', () => {
  it('renders component', () => {
    const props = {
      classes: mockClasses,
      type: 'private',
      address: 'test-address',
      description: 'test-description',
      handleChange: jest.fn(),
      handleClose: jest.fn(),
      handleCopy: jest.fn(),
      users: Immutable.Map({}),
      donationAddress: 'test'
    }
    const result = shallow(<AddFunds {...props} />)
    expect(result).toMatchSnapshot()
  })
})

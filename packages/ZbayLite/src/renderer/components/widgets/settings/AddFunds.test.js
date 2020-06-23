import React from 'react'
import { shallow } from 'enzyme'
import { AddFunds } from './AddFunds'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('AddFunds', () => {
  it('renders component', () => {
    const props = {
      classes: mockClasses,
      privateAddress: 'test-address-private',
      transparentAddress: 'test-address-transparent',
      setCurrentTab: jest.fn(),
      clearCurrentOpenTab: jest.fn(),
      scrollbarRef: {}
    }
    const result = shallow(<AddFunds {...props} />)
    expect(result).toMatchSnapshot()
  })
})

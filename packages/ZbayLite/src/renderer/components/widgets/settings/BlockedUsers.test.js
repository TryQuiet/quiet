import React from 'react'
import { shallow } from 'enzyme'
import { BlockedUsers } from './BlockedUsers'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('BlockedUsers', () => {
  it('renders component', () => {
    const props = {
      classes: mockClasses,
      unblock: jest.fn(),
      users: {},
      blockedUsers: {}
    }
    const result = shallow(<BlockedUsers {...props} />)
    expect(result).toMatchSnapshot()
  })
})

import React from 'react'
import { shallow } from 'enzyme'

import { UserRegisteredMessage } from './UserRegisteredMessage'
import { mockClasses } from '../../../../shared/testing/mocks'
import { _UserData } from '../../../store/handlers/users'
describe('UserRegisteredMessage', () => {
  const message = _UserData({
    address: 'testaddress',
    nickname: 'testnickname'
  })
  it('renders component', () => {
    const result = shallow(
      <UserRegisteredMessage classes={mockClasses} message={message} />
    )
    expect(result).toMatchSnapshot()
  })
})

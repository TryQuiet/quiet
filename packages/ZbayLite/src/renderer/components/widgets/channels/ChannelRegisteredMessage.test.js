import React from 'react'
import { shallow } from 'enzyme'

import { ChannelRegisteredMessage } from './ChannelRegisteredMessage'
import { mockClasses } from '../../../../shared/testing/mocks'
import { _PublicChannelData } from '../../../store/handlers/publicChannels'
describe('ChannelRegisteredMessage', () => {
  const message = _PublicChannelData({
    address: 'testaddress',
    name: 'testname'
  })
  it('renders component', () => {
    const result = shallow(
      <ChannelRegisteredMessage
        classes={mockClasses}
        username='testUsername'
        address='testAddress'
        onChannelClick={() => {}}
        message={message}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

import React from 'react'
import { shallow } from 'enzyme'

import { ChannelsListItem } from './ChannelsListItem'
import { createChannel } from '../../../testUtils'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('ChannelsListItem', () => {
  const privateChannel = createChannel(1)
  const publicChannel = createChannel(0)

  it('renders component', () => {
    const result = shallow(
      <ChannelsListItem
        classes={mockClasses}
        channel={{
          ...privateChannel,
          newMessages: []
        }}
        selected={{}}
        isRegisteredUsername
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component with address', () => {
    const result = shallow(
      <ChannelsListItem
        classes={mockClasses}
        channel={{
          ...privateChannel,
          newMessages: []
        }}
        displayAddress
        selected={{}}
        isRegisteredUsername
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component when public', () => {
    const result = shallow(
      <ChannelsListItem
        classes={mockClasses}
        channel={{
          ...publicChannel,
          newMessages: []
        }}
        selected={{}}
        isRegisteredUsername
      />
    )
    expect(result).toMatchSnapshot()
  })
})

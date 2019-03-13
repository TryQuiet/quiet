import React from 'react'
import { shallow } from 'enzyme'

import { ChannelsListItem } from './ChannelsListItem'
import { createChannel } from './testUtils'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('ChannelsListItem', () => {
  it('renders component', () => {
    const channel = createChannel(0)
    const result = shallow(
      <ChannelsListItem classes={mockClasses} channel={channel} />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component with address', () => {
    const channel = createChannel(0)
    const result = shallow(
      <ChannelsListItem classes={mockClasses} channel={channel} displayAddress />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component when public', () => {
    const channel = createChannel(1)
    const result = shallow(
      <ChannelsListItem classes={mockClasses} channel={channel} />
    )
    expect(result).toMatchSnapshot()
  })
})

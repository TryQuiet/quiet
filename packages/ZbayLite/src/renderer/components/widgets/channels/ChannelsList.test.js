import React from 'react'
import { shallow } from 'enzyme'

import { ChannelsListItem } from './ChannelsListItem'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('ChannelsListItem', () => {
  it('renders component', () => {
    const channel = {
      name: 'Politics',
      description: 'Discussion about politics.',
      private: true,
      unread: 14,
      hash: 'test-hash-1',
      address: 'zs1testaddress'
    }

    const result = shallow(
      <ChannelsListItem classes={mockClasses} channel={channel} />
    )
    expect(result).toMatchSnapshot()
  })
})

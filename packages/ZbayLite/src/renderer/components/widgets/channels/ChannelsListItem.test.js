import React from 'react'
import Immutable from 'immutable'
import { shallow } from 'enzyme'

import { ChannelsListItem } from './ChannelsListItem'
import { createChannel } from '../../../testUtils'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('ChannelsListItem', () => {
  const privateChannel = Immutable.fromJS(createChannel(1))
  const publicChannel = Immutable.fromJS(createChannel(0))

  it('renders component', () => {
    const result = shallow(
      <ChannelsListItem
        classes={mockClasses}
        channel={privateChannel}
        selected={Immutable.Record({})()}
        isRegisteredUsername
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component with address', () => {
    const result = shallow(
      <ChannelsListItem
        classes={mockClasses}
        channel={privateChannel}
        displayAddress
        selected={Immutable.Record({})()}
        isRegisteredUsername
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component when public', () => {
    const result = shallow(
      <ChannelsListItem
        classes={mockClasses}
        channel={publicChannel}
        selected={Immutable.Record({})()}
        isRegisteredUsername
      />
    )
    expect(result).toMatchSnapshot()
  })
})

import React from 'react'
import Immutable from 'immutable'
import { shallow } from 'enzyme'

import { ChannelHeader } from './ChannelHeader'
import { mockClasses } from '../../../../shared/testing/mocks'
import { createChannel } from '../../../testUtils'

describe('ChannelHeader', () => {
  it('renders component', () => {
    const channel = Immutable.fromJS(createChannel(1))
    const result = shallow(<ChannelHeader classes={mockClasses} channel={channel} members={null} />)
    expect(result).toMatchSnapshot()
  })

  it('renders without members count', () => {
    const channel = Immutable.fromJS(createChannel(1))
    const result = shallow(
      <ChannelHeader classes={mockClasses} channel={channel} members={new Set([1, 2, 3, 4])} />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders members when 0', () => {
    const channel = Immutable.fromJS(createChannel(1))
    const result = shallow(
      <ChannelHeader classes={mockClasses} channel={channel} members={new Set()} />
    )
    expect(result).toMatchSnapshot()
  })
})

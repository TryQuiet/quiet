import React from 'react'
import BigNumber from 'bignumber.js'
import Immutable from 'immutable'
import { shallow } from 'enzyme'

import { ChannelHeader } from './ChannelHeader'
import { mockClasses } from '../../../../shared/testing/mocks'
import { createChannel } from '../../../testUtils'

describe('ChannelHeader', () => {
  it('renders component', () => {
    const channel = Immutable.fromJS(createChannel(1)).set('members', new BigNumber(2345))
    const result = shallow(<ChannelHeader classes={mockClasses} channel={channel} />)
    expect(result).toMatchSnapshot()
  })

  it('renders without members count', () => {
    const channel = Immutable.fromJS(createChannel(1))
    const result = shallow(<ChannelHeader classes={mockClasses} channel={channel} />)
    expect(result).toMatchSnapshot()
  })

  it('renders members when 0', () => {
    const channel = Immutable.fromJS(createChannel(1)).set('members', new BigNumber(0))
    const result = shallow(<ChannelHeader classes={mockClasses} channel={channel} />)
    expect(result).toMatchSnapshot()
  })
})

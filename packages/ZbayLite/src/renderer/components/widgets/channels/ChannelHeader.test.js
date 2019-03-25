import React from 'react'
import BigNumber from 'bignumber.js'
import { shallow } from 'enzyme'

import { ChannelHeader } from './ChannelHeader'
import { ChannelState } from '../../../store/handlers/channel'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('ChannelHeader', () => {
  it('renders component', () => {
    const channel = ChannelState({
      name: 'General',
      members: new BigNumber('2345')
    })
    const result = shallow(<ChannelHeader classes={mockClasses} channel={channel} />)
    expect(result).toMatchSnapshot()
  })

  it('renders without members count', () => {
    const channel = ChannelState({
      name: 'General'
    })
    const result = shallow(<ChannelHeader classes={mockClasses} channel={channel} />)
    expect(result).toMatchSnapshot()
  })

  it('renders members when 0', () => {
    const channel = ChannelState({
      name: 'General',
      members: new BigNumber('0')
    })
    const result = shallow(<ChannelHeader classes={mockClasses} channel={channel} />)
    expect(result).toMatchSnapshot()
  })
})

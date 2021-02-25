import React from 'react'
import { shallow } from 'enzyme'

import { ChannelHeader } from './ChannelHeader'
import { mockClasses } from '../../../../shared/testing/mocks'
import { createChannel } from '../../../testUtils'

describe('ChannelHeader', () => {
  it('renders component', () => {
    const channel = createChannel(1)
    const result = shallow(
      <ChannelHeader
        tab={0}
        setTab={() => {}}
        unmute={() => {}}
        mutedFlag
        classes={mockClasses}
        channel={channel}
        members={null}
        name={'channel'}
        updateShowInfoMsg={jest.fn()}
        isRegisteredUsername
        userAddress='test'
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders without members count', () => {
    const channel = createChannel(1)
    const result = shallow(
      <ChannelHeader
        classes={mockClasses}
        tab={0}
        setTab={() => {}}
        channel={channel}
        members={new Set([1, 2, 3, 4])}
        unmute={() => {}}
        name={'channel'}
        updateShowInfoMsg={jest.fn()}
        mutedFlag
        userAddress='test'
        isRegisteredUsername
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders members when 0', () => {
    const channel = createChannel(1)
    const result = shallow(
      <ChannelHeader
        classes={mockClasses}
        tab={0}
        setTab={() => {}}
        channel={channel}
        members={new Set()}
        name={'channel'}
        updateShowInfoMsg={jest.fn()}
        unmute={() => {}}
        mutedFlag
        userAddress='test'
        isRegisteredUsername
      />
    )
    expect(result).toMatchSnapshot()
  })
})

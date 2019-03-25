import React from 'react'
import { DateTime } from 'luxon'
import { shallow } from 'enzyme'

import { ChannelMessage } from './ChannelMessage'
import { mockClasses } from '../../../../shared/testing/mocks'
import { now } from './testUtils'

describe('ChannelMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
  })

  it('renders component', () => {
    const message = {
      createdAt: now.minus({ hours: 1 }).toISO(),
      description: 'This is some message',
      address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly'
    }
    const result = shallow(<ChannelMessage classes={mockClasses} message={message} />)
    expect(result).toMatchSnapshot()
  })

  it('renders correct time for same week', () => {
    const message = {
      createdAt: now.minus({ days: 1 }).toISO(),
      description: 'This is some message',
      address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly'
    }
    const result = shallow(<ChannelMessage classes={mockClasses} message={message} />)
    expect(result).toMatchSnapshot()
  })

  it('renders correct time for different month', () => {
    const message = {
      createdAt: now.minus({ month: 1 }).toISO(),
      description: 'This is some message',
      address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly'
    }
    const result = shallow(<ChannelMessage classes={mockClasses} message={message} />)
    expect(result).toMatchSnapshot()
  })

  it('renders correct time for different year', () => {
    const message = {
      createdAt: now.minus({ year: 1 }).toISO(),
      description: 'This is some message',
      address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly'
    }
    const result = shallow(<ChannelMessage classes={mockClasses} message={message} />)
    expect(result).toMatchSnapshot()
  })

  it('renders username', () => {
    const message = {
      createdAt: now.minus({ hours: 2 }).toISO(),
      description: 'This is some message',
      username: 'Saturn',
      address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly'
    }
    const result = shallow(<ChannelMessage classes={mockClasses} message={message} />)
    expect(result).toMatchSnapshot()
  })
})

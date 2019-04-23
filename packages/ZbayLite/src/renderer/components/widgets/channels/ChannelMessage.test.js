import React from 'react'
import Immutable from 'immutable'
import { DateTime } from 'luxon'
import { shallow } from 'enzyme'

import { ChannelMessage } from './ChannelMessage'
import { mockClasses } from '../../../../shared/testing/mocks'
import { now, createMessage } from '../../../testUtils'

describe('ChannelMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
  })

  it('renders component', () => {
    const message = Immutable.fromJS(createMessage(1))
    const result = shallow(<ChannelMessage classes={mockClasses} message={message} />)
    expect(result).toMatchSnapshot()
  })

  it('renders correct time for same week', () => {
    const message = Immutable.fromJS(createMessage(1, now.minus({ days: 1 }).toSeconds()))
    const result = shallow(<ChannelMessage classes={mockClasses} message={message} />)
    expect(result).toMatchSnapshot()
  })

  it('renders correct time for different month', () => {
    const message = Immutable.fromJS(createMessage(1, now.minus({ month: 1 }).toSeconds()))
    const result = shallow(<ChannelMessage classes={mockClasses} message={message} />)
    expect(result).toMatchSnapshot()
  })

  it('renders correct time for different year', () => {
    const message = Immutable.fromJS(createMessage(1, now.minus({ year: 1 }).toSeconds()))
    const result = shallow(<ChannelMessage classes={mockClasses} message={message} />)
    expect(result).toMatchSnapshot()
  })

  it('renders username', () => {
    const message = Immutable.fromJS(
      createMessage(1, now.minus({ hours: 2 }).toSeconds())
    ).update('sender', sender => sender.set('username', 'Saturn'))
    const result = shallow(<ChannelMessage classes={mockClasses} message={message} />)
    expect(result).toMatchSnapshot()
  })
})

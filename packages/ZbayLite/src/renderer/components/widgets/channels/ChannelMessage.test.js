import React from 'react'
import Immutable from 'immutable'
import { DateTime } from 'luxon'
import { shallow } from 'enzyme'

import { ChannelMessage } from './ChannelMessage'
import { mockClasses } from '../../../../shared/testing/mocks'
import { now, createMessage } from '../../../testUtils'
import { DisplayableMessage } from '../../../zbay/messages'

describe('ChannelMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
  })

  it('renders component', () => {
    const message = Immutable.fromJS(createMessage(1))
    const result = shallow(
      <ChannelMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        onResend={jest.fn()}
        onReply={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component when message is sent by owner', () => {
    const message = Immutable.fromJS(createMessage(1)).set('fromYou', true)
    const result = shallow(
      <ChannelMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        onResend={jest.fn()}
        onReply={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

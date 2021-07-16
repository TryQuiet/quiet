import React from 'react'
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

  it('renders component', async () => {
    const message = await createMessage()
    const result = shallow(
      <ChannelMessage
        classes={mockClasses}
        message={message}
        onResend={jest.fn()}
        onReply={jest.fn()}
        onLinkedChannel={jest.fn()}
        onLinkedUser={jest.fn()}
        openExternalLink={jest.fn()}
        setWhitelistAll={jest.fn()}
        addToWhitelist={jest.fn()}
        publicChannels={{}}
        users={{}}
        whitelisted={[]}
        autoload={[]}
        allowAll={false}
      />
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component when message is sent by owner', async () => {
    const message = await createMessage()
    message.fromYou = true
    const result = shallow(
      <ChannelMessage
        classes={mockClasses}
        message={message}
        onResend={jest.fn()}
        onReply={jest.fn()}
        onLinkedChannel={jest.fn()}
        onLinkedUser={jest.fn()}
        openExternalLink={jest.fn()}
        setWhitelistAll={jest.fn()}
        addToWhitelist={jest.fn()}
        publicChannels={{}}
        users={{}}
        whitelisted={[]}
        autoload={[]}
        allowAll={false}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

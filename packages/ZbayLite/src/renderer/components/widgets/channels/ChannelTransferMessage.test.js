import React from 'react'
import Immutable from 'immutable'
import { DateTime } from 'luxon'
import { shallow } from 'enzyme'
import Bignumber from 'bignumber.js'

import { ChannelTransferMessage } from './ChannelTransferMessage'
import { mockClasses } from '../../../../shared/testing/mocks'
import {
  now,
  createSendableTransferMessage,
  createReceivedTransferMessage
} from '../../../testUtils'
import { DisplayableMessage } from '../../../zbay/messages'

describe('ChannelTransferMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
  })

  it('renders component', () => {
    const message = Immutable.fromJS(createReceivedTransferMessage(1))
    const result = shallow(
      <ChannelTransferMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        onResend={jest.fn()}
        onReply={jest.fn()}
        onCancel={jest.fn()}
        rateUsd={new Bignumber(1)}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component when message is sent by owner', () => {
    const message = Immutable.fromJS(createSendableTransferMessage(1)).set('fromYou', true)
    const result = shallow(
      <ChannelTransferMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        onResend={jest.fn()}
        onReply={jest.fn()}
        onCancel={jest.fn()}
        rateUsd={new Bignumber(1)}
      />
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component when message is pending', () => {
    const message = Immutable.fromJS(createSendableTransferMessage(1)).set('status', 'pending')
    const result = shallow(
      <ChannelTransferMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        onResend={jest.fn()}
        onReply={jest.fn()}
        onCancel={jest.fn()}
        rateUsd={new Bignumber(1)}
      />
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component when message is broadcasted', () => {
    const message = Immutable.fromJS(createSendableTransferMessage(1)).set('status', 'broadcasted')
    const result = shallow(
      <ChannelTransferMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        onResend={jest.fn()}
        onReply={jest.fn()}
        onCancel={jest.fn()}
        rateUsd={new Bignumber(1)}
      />
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component when message is success', () => {
    const message = Immutable.fromJS(createSendableTransferMessage(1)).set('status', 'success')
    const result = shallow(
      <ChannelTransferMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        onResend={jest.fn()}
        onReply={jest.fn()}
        onCancel={jest.fn()}
        rateUsd={new Bignumber(1)}
      />
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component when message is cancelled', () => {
    const message = Immutable.fromJS(createSendableTransferMessage(1)).set('status', 'cancelled')
    const result = shallow(
      <ChannelTransferMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        onResend={jest.fn()}
        onReply={jest.fn()}
        onCancel={jest.fn()}
        rateUsd={new Bignumber(1)}
      />
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component when message is failed', () => {
    const message = Immutable.fromJS(createSendableTransferMessage(1))
      .set('status', 'failed')
      .set('error', { code: 1, message: 'error' })
    const result = shallow(
      <ChannelTransferMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        onResend={jest.fn()}
        onReply={jest.fn()}
        onCancel={jest.fn()}
        rateUsd={new Bignumber(1)}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

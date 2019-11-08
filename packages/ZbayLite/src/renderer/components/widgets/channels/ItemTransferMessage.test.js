import React from 'react'
import { shallow } from 'enzyme'
import BigNumber from 'bignumber.js'
import Immutable from 'immutable'

import { mockClasses } from '../../../../shared/testing/mocks'
import { ItemTransferMessage } from './ItemTransferMessage'
import { DisplayableMessage } from '../../../zbay/messages'

describe('ItemTransferMessage', () => {
  it('renders component', () => {
    const message = Immutable.fromJS({
      replyTo: 'test-address',
      spent: 120,
      sender: {
        username: 'test',
        replyTo: 'test-address'
      },
      tag: 'test',
      offerOwner: 'tester',
      isUnregistered: false,
      username: 'test',
      fromYou: false,
      status: 'broadcasted',
      createdAt: 1313246566,
      error: {}
    })

    const result = shallow(
      <ItemTransferMessage message={DisplayableMessage(message)} classes={mockClasses} rateUsd={new BigNumber(38)} />
    )
    expect(result).toMatchSnapshot()
  })
})

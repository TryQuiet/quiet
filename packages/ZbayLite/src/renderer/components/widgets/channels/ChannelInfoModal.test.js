import React from 'react'
import BigNumber from 'bignumber.js'
import Immutable from 'immutable'
import { shallow } from 'enzyme'

import { ChannelInfoModal } from './ChannelInfoModal'
import { mockClasses } from '../../../../shared/testing/mocks'
import { createChannel } from '../../../testUtils'

describe('ChannelInfoModal', () => {
  it('renders component', () => {
    const channel = Immutable.fromJS(createChannel(1)).set('members', new BigNumber(2345))
    const result = shallow(
      <ChannelInfoModal
        open
        classes={mockClasses}
        channel={channel}
        shareUri='zbay://channel/channel-hash'
        handleClose={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component when closed', () => {
    const channel = Immutable.fromJS(createChannel(1)).set('members', new BigNumber(2345))
    const result = shallow(
      <ChannelInfoModal
        classes={mockClasses}
        channel={channel}
        shareUri='zbay://channel/channel-hash'
        handleClose={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

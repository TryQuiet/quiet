import React from 'react'
import { shallow } from 'enzyme'
import * as R from 'ramda'

import { BaseChannelsList, constants } from './BaseChannelsList'

const createChannel = id => ({
  name: `Channel ${id}`,
  description: id % 2 === 0 ? '' : `Channel about ${id}`,
  private: id % 2 === 0,
  unread: id,
  hash: `test-hash-${id}`,
  address: `zs1testaddress${id}`
})

describe('BaseChannelsList', () => {
  it('renders component', () => {
    const channels = R.range(0, 12).map(createChannel)
    const height = constants.itemSize * 12
    const result = shallow(
      <BaseChannelsList channels={channels} height={height} />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders list elements with displayAddress', () => {
    const channels = R.range(0, 3).map(createChannel)
    const height = constants.itemSize * 4
    const result = shallow(
      <BaseChannelsList
        channels={channels}
        height={height}
        displayAddress
      />
    )
    expect(result).toMatchSnapshot()
  })
})

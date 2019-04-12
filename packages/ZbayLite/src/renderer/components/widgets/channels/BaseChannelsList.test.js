import React from 'react'
import Immutable from 'immutable'
import { shallow } from 'enzyme'
import * as R from 'ramda'

import { BaseChannelsList, constants } from './BaseChannelsList'
import { createChannel } from '../../../testUtils'

describe('BaseChannelsList', () => {
  it('renders component', () => {
    const channels = Immutable.fromJS(R.range(0, 12).map(createChannel))
    const height = constants.itemSize * 12
    const result = shallow(
      <BaseChannelsList channels={channels} height={height} />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders list elements with displayAddress', () => {
    const channels = Immutable.fromJS(R.range(0, 3).map(createChannel))
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

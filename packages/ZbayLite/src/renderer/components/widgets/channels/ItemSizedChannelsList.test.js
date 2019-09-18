import React from 'react'
import Immutable from 'immutable'
import { shallow } from 'enzyme'
import * as R from 'ramda'

import { ItemSizedChannelsList } from './ItemSizedChannelsList'
import { constants } from './BaseChannelsList'
import { createChannel } from '../../../testUtils'

describe('ItemSizedChannelsList', () => {
  const itemsCount = 4
  const channels = Immutable.fromJS(R.range(0, itemsCount).map(createChannel))

  it('renders component', () => {
    const result = shallow(
      <ItemSizedChannelsList
        channels={channels}
        itemsCount={itemsCount}
        selected={Immutable.Record({})()}
      />
    )
    expect(result.prop('height')).toEqual(constants.itemSize * itemsCount)
    expect(result).toMatchSnapshot()
  })

  it('renders with correct height when displayAddress = true', () => {
    const result = shallow(
      <ItemSizedChannelsList
        channels={channels}
        itemsCount={itemsCount}
        displayAddress
        selected={Immutable.Record({})()}
      />
    )
    expect(result.prop('height')).toEqual(constants.itemWithSecondarySize * itemsCount)
    expect(result).toMatchSnapshot()
  })
})

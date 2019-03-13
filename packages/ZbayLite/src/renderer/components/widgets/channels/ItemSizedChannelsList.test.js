import React from 'react'
import { shallow } from 'enzyme'
import * as R from 'ramda'

import { ItemSizedChannelsList } from './ItemSizedChannelsList'
import { constants } from './BaseChannelsList'
import { createChannel } from './testUtils'

describe('ItemSizedChannelsList', () => {
  it('renders component', () => {
    const itemsCount = 4
    const channels = R.range(0, itemsCount).map(createChannel)
    const result = shallow(
      <ItemSizedChannelsList channels={channels} itemsCount={itemsCount} />
    )
    expect(result.prop('height')).toEqual(constants.itemSize * itemsCount)
    expect(result).toMatchSnapshot()
  })

  it('renders with correct height when displayAddress = true', () => {
    const itemsCount = 4
    const channels = R.range(0, itemsCount).map(createChannel)
    const result = shallow(
      <ItemSizedChannelsList channels={channels} itemsCount={itemsCount} displayAddress />
    )
    expect(result.prop('height')).toEqual(constants.itemWithSecondarySize * itemsCount)
    expect(result).toMatchSnapshot()
  })
})

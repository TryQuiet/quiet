import React from 'react'
import { shallow } from 'enzyme'
import * as R from 'ramda'

import { ScalingChannelsList } from './ScalingChannelsList'
import { constants } from './BaseChannelsList'
import { createChannel } from './testUtils'

describe('ScallingChannelsList', () => {
  it('renders component', () => {
    const channels = R.range(0, 4).map(createChannel)
    const targetHeight = constants.itemSize * 4
    const result = shallow(
      <ScalingChannelsList channels={channels} maxHeight={targetHeight + 20} />
    )
    expect(result.prop('height')).toEqual(targetHeight)
    expect(result).toMatchSnapshot()
  })
})

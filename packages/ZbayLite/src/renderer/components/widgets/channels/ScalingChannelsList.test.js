import React from 'react'
import Immutable from 'immutable'
import { shallow } from 'enzyme'
import * as R from 'ramda'

import { ScalingChannelsList } from './ScalingChannelsList'
import { constants } from './BaseChannelsList'
import testUtils from '../../../testUtils'

describe('ScallingChannelsList', () => {
  it('renders component', () => {
    const channels = Immutable.fromJS(
      R.range(0, 4).map(testUtils.channels.createChannel)
    )
    const targetHeight = constants.itemSize * 4
    const result = shallow(
      <ScalingChannelsList channels={channels} maxHeight={targetHeight + 20} />
    )
    expect(result.prop('height')).toEqual(targetHeight)
    expect(result).toMatchSnapshot()
  })
})

import React from 'react'
import Immutable from 'immutable'
import { shallow } from 'enzyme'
import * as R from 'ramda'

import { ChannelsPanel } from './ChannelsPanel'
import { createChannel } from '../../../testUtils'

describe('ChannelsPanel', () => {
  const channels = Immutable.fromJS(
    R.range(0, 4).map(createChannel)
  )

  it('renders component', () => {
    const contentRect = {
      bounds: {
        height: 200
      }
    }

    const result = shallow(
      <ChannelsPanel
        channels={channels}
        contentRect={contentRect}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders collapsed list if no bounds', () => {
    const contentRect = {
      bounds: {}
    }

    const result = shallow(
      <ChannelsPanel
        channels={channels}
        contentRect={contentRect}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

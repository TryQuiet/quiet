import React from 'react'
import { shallow } from 'enzyme'
import * as R from 'ramda'

import { ChannelsPanel } from './ChannelsPanel'
import { createChannel } from './testUtils'

describe('ChannelsPanel', () => {
  it('renders component', () => {
    const channels = R.range(0, 4).map(createChannel)
    const ref = React.createRef()
    const contentRect = {
      bounds: {
        height: 200
      }
    }

    const result = shallow(
      <ChannelsPanel
        channels={channels}
        contentRect={contentRect}
        measureRef={ref}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders collapsed list if no bounds', () => {
    const channels = R.range(0, 4).map(createChannel)
    const ref = React.createRef()
    const contentRect = {
      bounds: {}
    }

    const result = shallow(
      <ChannelsPanel
        channels={channels}
        contentRect={contentRect}
        measureRef={ref}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

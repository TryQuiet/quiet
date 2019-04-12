import React from 'react'
import { shallow } from 'enzyme'
import * as R from 'ramda'

import { DirectMessagesPanel } from './DirectMessagesPanel'
import testUtils from '../../../testUtils'

describe('DirectMessagesPanel', () => {
  it('renders component', () => {
    const channels = R.range(0, 4).map(testUtils.channels.createChannel)

    const result = shallow(<DirectMessagesPanel channels={channels} />)
    expect(result).toMatchSnapshot()
  })
})

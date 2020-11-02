import React from 'react'
import { shallow } from 'enzyme'
import * as R from 'ramda'
import { BaseChannelsList } from './BaseChannelsList'
import { createChannel } from '../../../testUtils'

describe('BaseChannelsList', () => {
  it('renders component', () => {
    const channels = R.range(0, 12).map(createChannel)
    const result = shallow(
      <BaseChannelsList channels={channels} selected={{}} />
    )
    expect(result).toMatchSnapshot()
  })
})

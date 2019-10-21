import React from 'react'
import Immutable from 'immutable'
import { shallow } from 'enzyme'
import * as R from 'ramda'
import { BaseChannelsList } from './BaseChannelsList'
import { createChannel } from '../../../testUtils'

describe('BaseChannelsList', () => {
  it('renders component', () => {
    const channels = Immutable.fromJS(R.range(0, 12).map(createChannel))
    const result = shallow(
      <BaseChannelsList channels={channels} selected={Immutable.Record({})()} />
    )
    expect(result).toMatchSnapshot()
  })
})

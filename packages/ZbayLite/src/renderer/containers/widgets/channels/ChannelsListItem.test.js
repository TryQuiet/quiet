import React from 'react'
import { shallow } from 'enzyme'

import ChannelsListItem from './ChannelsListItem'

describe('ChannelsListItem', () => {
  it('renders component with router', () => {
    const result = shallow(<ChannelsListItem />)
    expect(result).toMatchSnapshot()
  })
})

import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../../shared/testing/mocks'
import { ChannelInputAction } from './ChannelInputAction'

describe('ChannelInputAction', () => {
  it('renders component', () => {
    const result = shallow(
      <ChannelInputAction classes={mockClasses} onPostOffer={jest.fn()} onSendMoney={jest.fn()} />
    )
    expect(result).toMatchSnapshot()
  })
})

import React from 'react'
import { shallow } from 'enzyme'

import { ChannelMessageActions } from './ChannelMessageActions'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('ChannelMessageActions', () => {
  it('renders component', () => {
    const result = shallow(
      <ChannelMessageActions classes={mockClasses} onResend={jest.fn()} />
    )
    expect(result).toMatchSnapshot()
  })
})

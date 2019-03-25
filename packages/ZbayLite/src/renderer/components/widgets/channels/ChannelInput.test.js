import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../../shared/testing/mocks'
import { ChannelInput } from './ChannelInput'

describe('ChannelInput', () => {
  it('renders component', () => {
    const result = shallow(
      <ChannelInput
        classes={mockClasses}
        onChange={jest.fn()}
        onKeyPress={jest.fn()}
        message='this is just a test message'
      />
    )
    expect(result).toMatchSnapshot()
  })
})

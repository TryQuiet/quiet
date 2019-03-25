import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../../shared/testing/mocks'
import { ChannelMenuAction } from './ChannelMenuAction'

describe('ChannelMenuAction', () => {
  it('renders component', () => {
    const result = shallow(
      <ChannelMenuAction
        classes={mockClasses}
        onInfo={jest.fn()}
        onMute={jest.fn()}
        onDelete={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

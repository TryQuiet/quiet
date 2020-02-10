import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../../../shared/testing/mocks'
import { MentionElement } from './MentionElement'

describe('MentionElement', () => {
  it('renders component highlight', () => {
    const result = shallow(
      <MentionElement
        classes={mockClasses}
        onClick={jest.fn()}
        onMouseEnter={jest.fn()}
        name='test'
        channelName='#test'
        participant
        highlight
      />
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component not highlight', () => {
    const result = shallow(
      <MentionElement
        classes={mockClasses}
        onClick={jest.fn()}
        onMouseEnter={jest.fn()}
        name='test'
        channelName='#test'
        participant
        highlight={false}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

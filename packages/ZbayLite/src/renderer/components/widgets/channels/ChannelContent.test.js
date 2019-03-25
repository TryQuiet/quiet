import React from 'react'
import { shallow } from 'enzyme'

import { ChannelContent } from './ChannelContent'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('ChannelContent', () => {
  it('renders component', () => {
    const result = shallow(<ChannelContent classes={mockClasses} />)
    expect(result).toMatchSnapshot()
  })
})

import React from 'react'
import { shallow } from 'enzyme'

import { CreateChannelFormFinish } from './CreateChannelFormFinish'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('CreateChannelFormFinish', () => {
  it('renders component', () => {
    const result = shallow(<CreateChannelFormFinish classes={mockClasses} />)
    expect(result).toMatchSnapshot()
  })
})

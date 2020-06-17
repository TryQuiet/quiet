import React from 'react'
import { shallow } from 'enzyme'

import { LoadingMessage } from './LoadingMessage'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('LoadingMessage', () => {
  it('renders component', () => {
    const result = shallow(<LoadingMessage classes={mockClasses} />)
    expect(result).toMatchSnapshot()
  })
})

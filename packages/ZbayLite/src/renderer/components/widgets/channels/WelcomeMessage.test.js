import React from 'react'
import { shallow } from 'enzyme'

import { WelcomeMessage } from './WelcomeMessage'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('WelcomeMessage', () => {
  it('renders component', () => {
    const result = shallow(<WelcomeMessage classes={mockClasses} />)
    expect(result).toMatchSnapshot()
  })
})

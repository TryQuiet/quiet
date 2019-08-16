import React from 'react'
import { shallow } from 'enzyme'

import { AddDirectMessage } from './AddDirectMessage'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('AddDirectMessage', () => {
  it('renders component', () => {
    const result = shallow(<AddDirectMessage classes={mockClasses} />)
    expect(result).toMatchSnapshot()
  })
})

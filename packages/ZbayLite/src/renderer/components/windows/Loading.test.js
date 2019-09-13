import React from 'react'
import { shallow } from 'enzyme'

import { Loading } from './Loading'
import { mockClasses } from '../../../shared/testing/mocks'

describe('Loading', () => {
  it('renders component', () => {
    const result = shallow(<Loading classes={mockClasses} message='test Msg' />)
    expect(result).toMatchSnapshot()
  })
})

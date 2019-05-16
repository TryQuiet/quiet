/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { Main } from './Main'
import { mockClasses } from '../../../shared/testing/mocks'

describe('Main', () => {
  it('renders component', () => {
    const result = shallow(<Main classes={mockClasses} match={{ url: 'test' }} />)
    expect(result).toMatchSnapshot()
  })
})

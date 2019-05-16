/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { Index } from './Index'
import { mockClasses } from '../../../shared/testing/mocks'

describe('Index', () => {
  it('renders component', () => {
    const result = shallow(<Index classes={mockClasses} />)
    expect(result).toMatchSnapshot()
  })

  it('renders doesn\'t exists', () => {
    const result = shallow(<Index classes={mockClasses} exists={false} locked />)
    expect(result).toMatchSnapshot()
  })

  it('renders locked', () => {
    const result = shallow(<Index classes={mockClasses} exists locked />)
    expect(result).toMatchSnapshot()
  })

  it('renders unlocked', () => {
    const result = shallow(<Index classes={mockClasses} exists locked={false} />)
    expect(result).toMatchSnapshot()
  })
})

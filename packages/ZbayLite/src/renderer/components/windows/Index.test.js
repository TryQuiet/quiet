/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { Index } from './Index'

describe('Index', () => {
  it('renders component', () => {
    const result = shallow(<Index />)
    expect(result).toMatchSnapshot()
  })

  it('renders doesn\'t exists', () => {
    const result = shallow(<Index exists={false} locked />)
    expect(result).toMatchSnapshot()
  })

  it('renders locked', () => {
    const result = shallow(<Index exists locked />)
    expect(result).toMatchSnapshot()
  })

  it('renders unlocked', () => {
    const result = shallow(<Index exists locked={false} />)
    expect(result).toMatchSnapshot()
  })
})

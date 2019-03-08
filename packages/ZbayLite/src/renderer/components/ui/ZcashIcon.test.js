/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { ZcashIcon } from './ZcashIcon'

describe('ZcashIcon', () => {
  it('renders component', () => {
    const result = shallow(<ZcashIcon />)
    expect(result).toMatchSnapshot()
  })

  it('renders component with custom size', () => {
    const result = shallow(<ZcashIcon size={32} />)
    expect(result).toMatchSnapshot()
  })
})

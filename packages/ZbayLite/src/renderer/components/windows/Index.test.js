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

  it('renders when bootstrapping', () => {
    const result = shallow(
      <Index
        classes={mockClasses}
        bootstrapping
        bootstrappingMessage='Launching node'
      />
    )
    expect(result).toMatchSnapshot()
  })
})

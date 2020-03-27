import React from 'react'
import { shallow } from 'enzyme'

import { BuyZcash } from './BuyZcash'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('BuyZcash', () => {
  it('renders component', () => {
    const props = {
      classes: mockClasses
    }
    const result = shallow(<BuyZcash {...props} />)
    expect(result).toMatchSnapshot()
  })
})

import React from 'react'
import { shallow } from 'enzyme'

import { SpentFilterAction } from './SpentFilterAction'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('SpentFilter', () => {
  it('renders component', () => {
    const result = shallow(<SpentFilterAction classes={mockClasses} />)
    expect(result).toMatchSnapshot()
  })
})

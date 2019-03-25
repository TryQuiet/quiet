import React from 'react'
import { shallow } from 'enzyme'

import { SpentFilter } from './SpentFilter'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('SpentFilter', () => {
  it('renders component', () => {
    const result = shallow(
      <SpentFilter
        classes={mockClasses}
        value={20}
        handleOnChange={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component when max/inf', () => {
    const result = shallow(
      <SpentFilter
        classes={mockClasses}
        value={-1}
        handleOnChange={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

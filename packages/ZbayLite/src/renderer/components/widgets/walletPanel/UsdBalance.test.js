/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'
import BigNumber from 'bignumber.js'

import { mockClasses } from '../../../../shared/testing/mocks'
import { UsdBalance } from './UsdBalance'

describe('UsdBalance', () => {
  it('renders component', () => {
    const result = shallow(
      <UsdBalance classes={mockClasses} value={new BigNumber('3243.25')} />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders when no value', () => {
    const result = shallow(
      <UsdBalance classes={mockClasses} />
    )
    expect(result).toMatchSnapshot()
  })
})

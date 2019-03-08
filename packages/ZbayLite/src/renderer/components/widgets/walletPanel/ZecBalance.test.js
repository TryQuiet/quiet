/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'
import BigNumber from 'bignumber.js'

import { mockClasses } from '../../../../shared/testing/mocks'
import { ZecBalance } from './ZecBalance'

describe('ZecBalance', () => {
  it('renders component', () => {
    const result = shallow(
      <ZecBalance classes={mockClasses} value={new BigNumber('3243.253232')} />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders when no value', () => {
    const result = shallow(
      <ZecBalance classes={mockClasses} />
    )
    expect(result).toMatchSnapshot()
  })
})

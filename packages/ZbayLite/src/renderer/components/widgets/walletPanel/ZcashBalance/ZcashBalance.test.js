/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'
import BigNumber from 'bignumber.js'

import { mockClasses } from '../../../../../shared/testing/mocks'
import { ZcashBalance } from './ZcashBalance'

describe('ZcashBalance', () => {
  it('renders component', () => {
    const result = shallow(
      <ZcashBalance
        classes={mockClasses}
        usdBalance={new BigNumber('3243.25')}
        zecBalance={new BigNumber('12.323212')}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders when balanced locked', () => {
    const result = shallow(
      <ZcashBalance
        classes={mockClasses}
        usdBalance={new BigNumber('0')}
        zecBalance={new BigNumber('0')}
        usdLocked={new BigNumber('3243.25')}
        zecLocked={new BigNumber('12.323212')}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

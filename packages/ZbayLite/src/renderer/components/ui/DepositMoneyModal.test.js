/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { DepositMoneyModal } from './DepositMoneyModal'

describe('DepositMoneyModal', () => {
  it('renders component', () => {
    const result = shallow(
      <DepositMoneyModal
        open
        onClick={jest.fn()}
        handleClose={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

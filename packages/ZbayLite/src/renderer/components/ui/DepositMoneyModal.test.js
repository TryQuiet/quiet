/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { DepositMoneyModal } from './DepositMoneyModal'
import { mockClasses } from '../../../shared/testing/mocks'

describe('DepositMoneyModal', () => {
  it('renders component', () => {
    const result = shallow(
      <DepositMoneyModal
        open
        classes={mockClasses}
        handleClose={jest.fn()}
        onClick={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

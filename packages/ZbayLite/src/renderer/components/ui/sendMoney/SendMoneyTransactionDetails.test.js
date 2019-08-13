/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { SendMoneyTransactionDetails } from './SendMoneyTransactionDetails'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('SendMoneyTransactionDetails', () => {
  it('renders component', () => {
    const result = shallow(
      <SendMoneyTransactionDetails
        classes={mockClasses}
        step={1}
        setStep={jest.fn()}
        submitForm={jest.fn()}
        amountUsd='10'
        amountZec='20'
        memo='test'
        recipient='test'
        feeUsd={0.1}
        feeZec={0.1}
        handleClose={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

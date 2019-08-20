/* eslint import/first: 0 */
import React from 'react'
import BigNumber from 'bignumber.js'
import { shallow } from 'enzyme'

import { SendMoneyForm } from './SendMoneyForm'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('SendMoneyForm', () => {
  it('renders component when valid = true', () => {
    const result = shallow(
      <SendMoneyForm
        classes={mockClasses}
        step={1}
        setStep={jest.fn()}
        rateUsd={new BigNumber(50)}
        rateZec={new BigNumber(0.4)}
        balanceZec={new BigNumber(0.7)}
        values={{ recipient: 'address123' }}
        isValid
      />
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component when valid = false', () => {
    const result = shallow(
      <SendMoneyForm
        classes={mockClasses}
        step={1}
        setStep={jest.fn()}
        rateUsd={new BigNumber(50)}
        rateZec={new BigNumber(0.4)}
        values={{ recipient: 'address123' }}
        balanceZec={new BigNumber(0.7)}
        isValid={false}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

/* eslint import/first: 0 */
import React from 'react'
import BigNumber from 'bignumber.js'
import { shallow } from 'enzyme'
import Immutable from 'immutable'

import { SendMoneyForm } from './SendMoneyForm'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('SendMoneyForm', () => {
  it('renders component when valid = true', () => {
    const result = shallow(
      <SendMoneyForm
        classes={mockClasses}
        step={1}
        setStep={jest.fn()}
        rateUsd={1}
        rateZec={1}
        balanceZec={new BigNumber(0.7)}
        values={{ recipient: 'address123' }}
        touched={false}
        isValid
        errors={{}}
        users={Immutable.fromJS([
          {
            nickname: 'test',
            address: 'test-address'
          }
        ])}
        shippingData={{ data: 'test' }}
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
        rateUsd={1}
        rateZec={1}
        values={{ recipient: 'address123' }}
        balanceZec={new BigNumber(0.7)}
        isValid={false}
        errors={{}}
        touched={false}
        users={Immutable.fromJS([
          {
            nickname: 'test',
            address: 'test-address'
          }
        ])}
        shippingData={{ data: 'test' }}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

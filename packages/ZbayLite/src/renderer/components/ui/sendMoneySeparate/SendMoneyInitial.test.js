import React from 'react'
import BigNumber from 'bignumber.js'
import { shallow } from 'enzyme'
import Immutable from 'immutable'

import { SendMoneyInitial } from './SendMoneyInitial'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('SendMoneyForm', () => {
  it('renders component', () => {
    const result = shallow(
      <SendMoneyInitial
        classes={mockClasses}
        rateUsd={new BigNumber(0.7)}
        rateZec={0.00012}
        balanceZec={new BigNumber(0.7)}
        values={{ recipient: 'address123' }}
        touched={{}}
        isValid
        errors={{}}
        feeZec={0.00001}
        feeUsd={0.00001}
        submitForm={jest.fn()}
        handleClose={jest.fn()}
        setFieldValue={jest.fn()}
        nickname={'test-nickname'}
        users={Immutable.fromJS([
          {
            nickname: 'test',
            address: 'test-address'
          }
        ])}
        openSentFundsModal={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

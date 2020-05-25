import React from 'react'
import BigNumber from 'bignumber.js'
import { shallow } from 'enzyme'
import Immutable from 'immutable'

import { SendMoneyMain } from './SendMoneyMain'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('SendMoneyForm', () => {
  it('renders component', () => {
    const result = shallow(
      <SendMoneyMain
        classes={mockClasses}
        initialValues={{
          recipient: 'test-recipient',
          amountUsd: '0.0001',
          amountZec: '0.001',
          memo: 'test-memo'
        }}
        rateUsd={new BigNumber(0.002)}
        rateZec={1}
        balanceZec={new BigNumber(0.7)}
        values={{ recipient: 'address123' }}
        touched={false}
        isValid
        errors={{}}
        feeZec={0.00001}
        feeUsd={0.00001}
        submitForm={jest.fn()}
        handleClose={jest.fn()}
        setFieldValue={jest.fn()}
        nickname={'test-nickname'}
        sendPlainTransfer={jest.fn()}
        users={Immutable.fromJS([
          {
            nickname: 'test',
            address: 'test-address'
          }
        ])}
        openSentFundsModal={jest.fn()}
        sendMessageHandler={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

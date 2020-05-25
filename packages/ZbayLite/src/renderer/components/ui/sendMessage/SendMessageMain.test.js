import React from 'react'
import BigNumber from 'bignumber.js'
import { shallow } from 'enzyme'
import Immutable from 'immutable'

import { SendMessageMain } from './SendMessageMain'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('SendMessageSeparateMain', () => {
  it('renders component', () => {
    const result = shallow(
      <SendMessageMain
        classes={mockClasses}
        balanceZec={new BigNumber(0.7)}
        values={{ recipient: 'address123' }}
        touched={{}}
        isValid
        initialValues={{
          recipient: '',
          sendAnonymously: false,
          memo: ''
        }}
        memo={'test memo'}
        errors={{}}
        feeZec={0.00001}
        feeUsd={0.00001}
        submitForm={jest.fn()}
        handleClose={jest.fn()}
        nickname={'test-nickname'}
        users={Immutable.fromJS([
          {
            nickname: 'test',
            address: 'test-address'
          }
        ])}
        openSentFundsModal={jest.fn()}
        sendPlainTransfer={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

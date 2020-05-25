import React from 'react'
import BigNumber from 'bignumber.js'
import { shallow } from 'enzyme'
import Immutable from 'immutable'

import { SendMessageInitial } from './SendMessageInitial'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('SendMessageSeparateInitial', () => {
  it('renders component', () => {
    const result = shallow(
      <SendMessageInitial
        classes={mockClasses}
        balanceZec={new BigNumber(0.7)}
        values={{ recipient: 'address123' }}
        touched={false}
        isValid
        memo={'test memo'}
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

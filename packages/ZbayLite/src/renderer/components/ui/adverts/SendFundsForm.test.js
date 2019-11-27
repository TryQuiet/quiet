/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'
import BigNumber from 'bignumber.js'

import { SendFundsForm } from './SendFundsForm'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('SendFundsForm', () => {
  it('renders component SendFoundsForm', () => {
    const payload = {
      background: 28,
      tag: 'dirtbike',
      nickname: 'roks33',
      priceUSD: 123,
      priceZcash: 0.12
    }
    const result = shallow(
      <SendFundsForm
        classes={mockClasses}
        balanceZec={new BigNumber(0.7)}
        handleClose={jest.fn()}
        handleSend={jest.fn()}
        rateUsd={new BigNumber(50)}
        rateZec={1 / new BigNumber(50)}
        open
        values={{
          zec: 21
        }}
        shippingData={{
          street: 'test',
          country: 'Poland',
          region: '',
          postalCode: '21',
          city: 'San Francisco',
          address: 'Green street'
        }}
        payload={payload}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { SendMoneySending } from './SendMoneySending'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('SendMoneySending', () => {
  it('renders component when sent = true', () => {
    const result = shallow(
      <SendMoneySending
        classes={mockClasses}
        step={1}
        setStep={jest.fn()}
        amountUsd='10'
        amountZec='20'
        feeUsd={0.1}
        feeZec={0.1}
        sent
      />
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component when sent != true', () => {
    const result = shallow(
      <SendMoneySending
        classes={mockClasses}
        step={1}
        setStep={jest.fn()}
        amountUsd='10'
        amountZec='20'
        feeUsd={0.1}
        feeZec={0.1}
        sent={false}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

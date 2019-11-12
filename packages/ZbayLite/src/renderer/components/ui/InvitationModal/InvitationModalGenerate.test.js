/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'
import BigNumber from 'bignumber.js'

import { mockClasses } from '../../../../shared/testing/mocks'
import { InvitationModalGenerate } from './InvitationModalGenerate'

describe('InvitationModalGenerate', () => {
  it('renders component', () => {
    const result = shallow(
      <InvitationModalGenerate
        classes={mockClasses}
        zecRate={1}
        amount='9'
        amountZec='0'
        balance={new BigNumber(1)}
        handleClose={jest.fn()}
        setStep={jest.fn()}
        includeAffiliate={jest.fn()}
        setAmount={jest.fn()}
        setAmountZec={jest.fn()}
        isLoading={jest.fn()}
        setLoading={jest.fn()}
        generateInvitation={jest.fn()}
        affiliate
      />
    )
    expect(result).toMatchSnapshot()
  })
})

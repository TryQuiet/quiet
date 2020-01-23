/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'
import { DateTime } from 'luxon'
import { SentFundsModal } from './SentFundsModal'
import { mockClasses } from '../../../shared/testing/mocks'

describe('SentFundsModal', () => {
  it('renders component', () => {
    const result = shallow(
      <SentFundsModal
        classes={mockClasses}
        open
        recipient='test'
        amountZec={12}
        handleClose={() => {}}
        amountUsd={12}
        feeUsd={0}
        feeZec={0}
        memo='random text'
        timestamp={DateTime.utc(2017).toSeconds()}
        valueWhenSent={100}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

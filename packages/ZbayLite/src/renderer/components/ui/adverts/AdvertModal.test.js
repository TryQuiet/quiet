/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'
import BigNumber from 'bignumber.js'

import { AdvertModal } from './AdvertModal'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('AdvertModal', () => {
  it('renders component AdvertModal', () => {
    const result = shallow(
      <AdvertModal
        classes={mockClasses}
        balanceZec={new BigNumber(0.7)}
        rateUsd={new BigNumber(0.7)}
        rateZec={1}
        handleClose={jest.fn()}
        handleSend={jest.fn()}
        setFieldValue={jest.fn()}
        open
        isValid
        values={{}}
        touched={{}}
        errors={{}}
        submitForm={jest.fn()}
        sending={false}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

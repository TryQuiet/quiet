/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'
import BigNumber from 'bignumber.js'

import { AdvertForm } from './AdvertForm'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('AdvertForm', () => {
  it('renders component AdvertForm', () => {
    const result = shallow(
      <AdvertForm
        classes={mockClasses}
        balanceZec={new BigNumber(0.7)}
        handleClose={jest.fn()}
        handleSend={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../../shared/testing/mocks'
import { InvitationModalGenerate } from './InvitationModalGenerate'

describe('InvitationModalGenerate', () => {
  it('renders component', () => {
    const result = shallow(
      <InvitationModalGenerate
        classes={mockClasses}
        open
        zecRate={1}
        amount={9}
        handleClose={jest.fn()}
        setStep={jest.fn()}
        includeAffiliate={jest.fn()}
        setAmount={jest.fn()}
        affiliate
      />
    )
    expect(result).toMatchSnapshot()
  })
})

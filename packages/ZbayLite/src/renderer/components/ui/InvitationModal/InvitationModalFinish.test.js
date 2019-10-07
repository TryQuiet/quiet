/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../../shared/testing/mocks'
import { InvitationModalFinish } from './InvitationModalFinish'

describe('InvitationModalFinish', () => {
  it('renders component', () => {
    const result = shallow(
      <InvitationModalFinish
        classes={mockClasses}
        handleClose={jest.fn()}
        open
        amount={9}
        setStep={jest.fn()}
        reset={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

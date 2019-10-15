/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../../shared/testing/mocks'
import { ReceivedInvitationModal } from './ReceivedInvitationModal'

describe('ReceivedInvitationModal', () => {
  it('renders component', () => {
    const result = shallow(
      <ReceivedInvitationModal
        classes={mockClasses}
        open
        handleClose={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../../shared/testing/mocks'
import { InvitationModal } from './InvitationModal'

describe('InvitationModal', () => {
  it('renders component', () => {
    const result = shallow(
      <InvitationModal
        classes={mockClasses}
        open
        info='test info'
        title='test tiltle'
        handleClose={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

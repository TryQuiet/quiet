/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { UpdateModal } from './UpdateModal'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('UpdateModal', () => {
  it('renders component', () => {
    const result = shallow(
      <UpdateModal
        open
        classes={mockClasses}
        handleClose={jest.fn()}
        handleUpdate={jest.fn()}
        rejectUpdate={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

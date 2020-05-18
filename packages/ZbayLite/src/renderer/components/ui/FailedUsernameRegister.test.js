/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { FailedUsernameRegister } from './FailedUsernameRegister'
import { mockClasses } from '../../../shared/testing/mocks'

describe('FailedUsernameRegister', () => {
  it('renders component', () => {
    const result = shallow(
      <FailedUsernameRegister
        open
        classes={mockClasses}
        handleClose={jest.fn()}
        openModalCreateUsername={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

import React from 'react'
import { shallow } from 'enzyme'

import { UserListItem } from './UserListItem'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('UserListItem', () => {
  it('renders component', () => {
    const result = shallow(
      <UserListItem
        classes={mockClasses}
        name='testname'
        action={() => {}}
        disableConfirmation
        actionName='testactionname'
      />
    )
    expect(result).toMatchSnapshot()
  })
})

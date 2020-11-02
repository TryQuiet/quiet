import React from 'react'
import { shallow } from 'enzyme'

import { BlockedUsers } from './BlockedUsers'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('BlockedUsers', () => {
  it('renders component', () => {
    const result = shallow(
      <BlockedUsers
        classes={mockClasses}
        users={{}}
        blockedUsers={{}}
        unblockUser={() => {}}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

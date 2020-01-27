import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'

import { BlockedUsers } from './BlockedUsers'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('BlockedUsers', () => {
  it('renders component', () => {
    const result = shallow(
      <BlockedUsers
        classes={mockClasses}
        users={Immutable.Map({})}
        blockedUsers={Immutable.List()}
        unblockUser={() => {}}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

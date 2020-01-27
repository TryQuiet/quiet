import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'

import { Moderators } from './Moderators'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('Moderators', () => {
  it('renders component', () => {
    const result = shallow(
      <Moderators
        classes={mockClasses}
        users={Immutable.Map({})}
        moderators={Immutable.List()}
        openAddModerator={() => {}}
        removeModerator={() => {}}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

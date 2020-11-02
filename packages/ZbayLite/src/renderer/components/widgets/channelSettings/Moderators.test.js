import React from 'react'
import { shallow } from 'enzyme'

import { Moderators } from './Moderators'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('Moderators', () => {
  it('renders component', () => {
    const result = shallow(
      <Moderators
        classes={mockClasses}
        users={{}}
        moderators={[]}
        openAddModerator={() => {}}
        removeModerator={() => {}}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

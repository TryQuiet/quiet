import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'

import { AddModerator } from './AddModerator'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('AddModerator', () => {
  it('renders component', () => {
    const result = shallow(
      <AddModerator
        classes={mockClasses}
        open
        handleClose={() => {}}
        members={new Set()}
        users={Immutable.Map({})}
        addModerator={() => {}}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

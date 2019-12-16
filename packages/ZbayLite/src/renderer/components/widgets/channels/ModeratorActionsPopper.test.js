import React from 'react'
import { shallow } from 'enzyme'

import { ModeratorActionsPopper } from './ModeratorActionsPopper'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('ModeratorActionsPopper', () => {
  it('renders', () => {
    const result = shallow(
      <ModeratorActionsPopper
        classes={mockClasses}
        name='123'
        address='123'
        open
        anchorEl={React.createRef()}
        banUser={jest.fn()}
        removeMessage={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

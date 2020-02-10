import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../../../shared/testing/mocks'
import { MentionPoper } from './MentionPoper'

describe('MentionPoper', () => {
  it('renders component highlight', () => {
    const result = shallow(
      <MentionPoper classes={mockClasses} anchorEl={{}} selected={1} />
    )
    expect(result).toMatchSnapshot()
  })
})

import React from 'react'
import { shallow } from 'enzyme'

import { NodePanel } from './NodePanel'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('NodePanel', () => {
  it('renders component', () => {
    const result = shallow(
      <NodePanel classes={mockClasses} />
    )
    expect(result).toMatchSnapshot()
  })
})

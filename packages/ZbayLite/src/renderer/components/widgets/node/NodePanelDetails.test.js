import React from 'react'
import { shallow } from 'enzyme'

import { NodePanelDetails } from './NodePanelDetails'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('NodePanelDetails', () => {
  it('renders component', () => {
    const result = shallow(
      <NodePanelDetails classes={mockClasses} />
    )
    expect(result).toMatchSnapshot()
  })
})

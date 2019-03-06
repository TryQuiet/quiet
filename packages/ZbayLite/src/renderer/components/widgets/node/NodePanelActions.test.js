import React from 'react'
import { shallow } from 'enzyme'

import { NodePanelActions } from './NodePanelActions'

describe('NodePanelActions', () => {
  it('renders component', () => {
    const result = shallow(
      <NodePanelActions onRestart={jest.fn()} onPower={jest.fn()} />
    )
    expect(result).toMatchSnapshot()
  })
})

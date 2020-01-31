import React from 'react'
import { shallow } from 'enzyme'

import { NodePanel } from './NodePanel'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('NodePanel', () => {
  it('renders component', () => {
    const result = shallow(
      <NodePanel
        classes={mockClasses}
        expanded={false}
        setExpanded={jest.fn()}
        freeUtxos={2}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

import React from 'react'
import { shallow } from 'enzyme'

import { NodeStatus } from './NodeStatus'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('NodeStatus', () => {
  each(['healthy', 'syncing', 'restarting', 'down']).test(
    'renders for status %s',
    (status) => {
      const result = shallow(
        <NodeStatus status={status} classes={mockClasses} />
      )
      expect(result).toMatchSnapshot()
    }
  )

  it('renders sync progress in percent', () => {
    const result = shallow(
      <NodeStatus status='syncing' classes={mockClasses} percentSynced='78' />
    )
    expect(result).toMatchSnapshot()
  })
})

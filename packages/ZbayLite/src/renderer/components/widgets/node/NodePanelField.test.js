/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { NodePanelField } from './NodePanelField'

describe('VaultCreator', () => {
  it('renders component', () => {
    const Content = () => <div>Test Content</div>

    const result = shallow(
      <NodePanelField name='test field'>
        <Content />
      </NodePanelField>
    )
    expect(result).toMatchSnapshot()
  })
})

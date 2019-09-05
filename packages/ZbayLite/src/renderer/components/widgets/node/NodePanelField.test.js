/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { NodePanelField } from './NodePanelField'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('VaultCreator', () => {
  it('renders component', () => {
    const result = shallow(<NodePanelField name='test field' classes={mockClasses} />)
    expect(result).toMatchSnapshot()
  })
})

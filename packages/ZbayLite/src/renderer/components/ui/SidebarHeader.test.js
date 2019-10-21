/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { SidebarHeader } from './SidebarHeader'
import { mockClasses } from '../../../shared/testing/mocks'

describe('SidebarHeader', () => {
  it('renders component', () => {
    const Action = () => (<div>SomeAction</div>)
    const result = shallow(
      <SidebarHeader
        classes={mockClasses}
        title='sample title'
        tooltipText='sample text'
        actions={[<Action key={1} />]}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

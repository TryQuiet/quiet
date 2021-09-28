/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { SidebarHeader } from './SidebarHeader'

describe('SidebarHeader', () => {
  it('renders component', () => {
    const result = shallow(
      <SidebarHeader
        title='sample title'
        action={jest.fn()}
        actionTitle={jest.fn()}
        tooltipText='sample text'
      />
    )
    expect(result).toMatchSnapshot()
  })
})

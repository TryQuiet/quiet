import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../shared/testing/mocks'
import { MenuAction } from './MenuAction'
import MenuActionItem from './MenuActionItem'

describe('MenuAction', () => {
  it('renders component', () => {
    const icon = 'icon'
    const iconHover = 'iconHover'
    const result = shallow(
      <MenuAction classes={mockClasses} icon={icon} iconHover={iconHover}>
        <MenuActionItem onClick={jest.fn()} title='test' />
        <MenuActionItem onClick={jest.fn()} title='test 2' />
      </MenuAction>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders with optional props', () => {
    const icon = 'icon'
    const iconHover = 'iconHover'
    const IconButton = () => <div>IconButton</div>
    const result = shallow(
      <MenuAction
        classes={mockClasses}
        icon={icon}
        iconHover={iconHover}
        IconButton={IconButton}
        offset='0 20'
      >
        <MenuActionItem onClick={jest.fn()} title='test' />
        <MenuActionItem onClick={jest.fn()} title='test 2' />
      </MenuAction>
    )
    expect(result).toMatchSnapshot()
  })
})

import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../shared/testing/mocks'
import { MenuAction } from './MenuAction'
import { MenuItem } from './channels/types'

describe('MenuAction', () => {
  it('renders component', () => {
    const Icon = () => (<div>Icon</div>)
    const menuItems = [
      MenuItem({
        title: 'test',
        onClick: jest.fn()
      }),
      MenuItem({
        title: 'test 2',
        onClick: jest.fn()
      })
    ]
    const result = shallow(
      <MenuAction classes={mockClasses} Icon={Icon} menuItems={menuItems} />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders with optional props', () => {
    const Icon = () => (<div>Icon</div>)
    const IconButton = () => (<div>IconButton</div>)
    const menuItems = [
      MenuItem({
        title: 'test',
        onClick: jest.fn()
      }),
      MenuItem({
        title: 'test 2',
        onClick: jest.fn()
      })
    ]
    const result = shallow(
      <MenuAction
        classes={mockClasses}
        Icon={Icon}
        IconButton={IconButton}
        menuItems={menuItems}
        offset='0 20'
      />
    )
    expect(result).toMatchSnapshot()
  })
})

/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../shared/testing/mocks'
import { PopupMenu } from './PopupMenu'

describe('PopupMenu', () => {
  it('renders component', () => {
    const Content = () => <div>Content</div>
    const result = shallow(
      <PopupMenu
        open
        classes={mockClasses}
        anchorEl={React.createRef()}
      >
        <Content />
      </PopupMenu>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders when closed', () => {
    const Content = () => <div>Content</div>
    const result = shallow(
      <PopupMenu
        open={false}
        classes={mockClasses}
        anchorEl={React.createRef()}
      >
        <Content />
      </PopupMenu>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders with offset', () => {
    const Content = () => <div>Content</div>
    const result = shallow(
      <PopupMenu
        open
        classes={mockClasses}
        anchorEl={React.createRef()}
        offset='0 10'
      >
        <Content />
      </PopupMenu>
    )
    expect(result).toMatchSnapshot()
  })
})

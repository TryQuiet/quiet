/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../shared/testing/mocks'
import { IconButton } from './IconButton'

describe('ProgressFab', () => {
  const Icon = () => <div>Icon</div>

  it('renders component', () => {
    const result = shallow(
      <IconButton classes={mockClasses} >
        <Icon />
      </IconButton>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders with passed components', () => {
    const result = shallow(
      <IconButton classes={mockClasses} onClick={jest.fn()} buttonRef={React.createRef()}>
        <Icon />
      </IconButton>
    )
    expect(result).toMatchSnapshot()
  })
})

/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../shared/testing/mocks'
import { ProgressFab } from './ProgressFab'

describe('ProgressFab', () => {
  const Icon = () => <div>Icon</div>

  it('renders component', () => {
    const result = shallow(
      <ProgressFab
        classes={mockClasses}
        onClick={jest.fn()}
      >
        <Icon />
      </ProgressFab>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders success', () => {
    const result = shallow(
      <ProgressFab
        classes={mockClasses}
        onClick={jest.fn()}
        success
      >
        <Icon />
      </ProgressFab>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders loading', () => {
    const result = shallow(
      <ProgressFab
        classes={mockClasses}
        onClick={jest.fn()}
        loading
      >
        <Icon />
      </ProgressFab>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders disabled', () => {
    const result = shallow(
      <ProgressFab
        classes={mockClasses}
        onClick={jest.fn()}
        success
        disabled
      >
        <Icon />
      </ProgressFab>
    )
    expect(result).toMatchSnapshot()
  })
})

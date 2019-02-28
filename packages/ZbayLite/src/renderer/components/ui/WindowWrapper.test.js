/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { WindowWrapper } from './WindowWrapper'
import { mockClasses } from '../../../shared/testing/mocks'

describe('WindowWrapper', () => {
  const Page = () => <div>Test page</div>

  it('renders component', () => {
    const result = shallow(
      <WindowWrapper classes={mockClasses} >
        <Page />
      </WindowWrapper>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders with custom className', () => {
    const result = shallow(
      <WindowWrapper classes={mockClasses} className='test-class'>
        <Page />
      </WindowWrapper>
    )
    expect(result).toMatchSnapshot()
  })
})

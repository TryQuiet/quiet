/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { WindowWrapper } from './WindowWrapper'

describe('WindowWrapper', () => {
  const Page = () => <div>Test page</div>

  it('renders component', () => {
    const result = shallow(
      <WindowWrapper>
        <Page />
      </WindowWrapper>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders with custom className', () => {
    const result = shallow(
      <WindowWrapper className='test-class'>
        <Page />
      </WindowWrapper>
    )
    expect(result).toMatchSnapshot()
  })
})

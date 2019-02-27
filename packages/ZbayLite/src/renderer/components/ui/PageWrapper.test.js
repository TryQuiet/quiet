/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { PageWrapper } from './PageWrapper'
import { mockClasses } from '../../../shared/testing/mocks'

describe('PageWrapper', () => {
  const Page = () => <div>Test page</div>

  it('renders component', () => {
    const result = shallow(
      <PageWrapper classes={mockClasses} >
        <Page />
      </PageWrapper>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders with custom className', () => {
    const result = shallow(
      <PageWrapper classes={mockClasses} className='test-class'>
        <Page />
      </PageWrapper>
    )
    expect(result).toMatchSnapshot()
  })
})

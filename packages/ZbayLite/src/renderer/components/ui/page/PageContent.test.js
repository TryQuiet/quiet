/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { PageContent } from './PageContent'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('PageContent', () => {
  const Content = () => <div>Test content</div>

  it('renders component', () => {
    const result = shallow(
      <PageContent classes={mockClasses} >
        <Content />
      </PageContent>
    )
    expect(result).toMatchSnapshot()
  })
})

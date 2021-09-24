/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { PageHeader } from './PageHeader'
import { mockClasses } from '../../../../shared/testing/mocks'
describe('PageHeader', () => {
  const Content = () => <div>Test Header</div>

  it('renders component', () => {
    const result = shallow(
      <PageHeader classes={mockClasses} >
        <Content />
      </PageHeader>
    )
    expect(result).toMatchSnapshot()
  })
})

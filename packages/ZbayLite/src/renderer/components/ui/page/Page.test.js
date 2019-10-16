/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { Page } from './Page'

import PageHeader from './PageHeader'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('Page', () => {
  it('renders component', () => {
    const result = shallow(
      <Page>
        <PageHeader classes={mockClasses}>
          <div>Test header</div>
        </PageHeader>
        <div>Test header</div>
      </Page>
    )
    expect(result).toMatchSnapshot()
  })
})

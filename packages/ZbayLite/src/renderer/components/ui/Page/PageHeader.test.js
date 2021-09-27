/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { PageHeader } from './PageHeader'
import { mockClasses } from '../../../../shared/testing/mocks'

import { MuiThemeProvider } from '@material-ui/core/styles'
import { theme } from '../../../theme'

describe('PageHeader', () => {
  const Content = () => <div>Test Header</div>

  it('renders component', () => {
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <PageHeader classes={mockClasses}>
          <Content />
        </PageHeader>
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})

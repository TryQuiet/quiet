/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { QuitAppDialog } from './QuitAppDialog'
import { mockClasses } from '../../../../shared/testing/mocks'

import { MuiThemeProvider } from '@material-ui/core/styles'
import { theme } from '../../../theme'

describe('QuitAppDialog', () => {
  it('renders component', () => {
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <QuitAppDialog open classes={mockClasses} handleClose={jest.fn()} handleQuit={jest.fn()} />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})

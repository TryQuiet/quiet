/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { FailedUsernameRegister } from './FailedUsernameRegister'
import { mockClasses } from '../../../../shared/testing/mocks'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../../theme'

describe('FailedUsernameRegister', () => {
  it('renders component', () => {
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <FailedUsernameRegister
          open
          classes={mockClasses}
          handleClose={jest.fn()}
          openModalCreateUsername={jest.fn()}
        />

      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})

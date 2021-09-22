/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { LoadingButton } from './LoadingButton'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../theme'

describe('Loading button', () => {
  it('renders component', () => {
    const props = {
      inProgress: false
    }
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <LoadingButton
          props={props}
        />
      </MuiThemeProvider>

    )
    expect(result).toMatchSnapshot()
  })
})

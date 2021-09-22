/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { ErrorModal } from './ErrorModal'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../theme'

describe('ErrorModal', () => {
  it('renders component', () => {
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ErrorModal
          open
          message='Test error message'
          traceback='Error: Test error message, error traceback'
          handleExit={jest.fn()}
          handleCopy={jest.fn()}
          restartApp={jest.fn()}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})

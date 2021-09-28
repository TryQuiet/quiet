import React from 'react'
import { shallow } from 'enzyme'

import { ChannelMessageActions } from './ChannelMessageActions'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../../theme'

describe('ChannelMessageActions', () => {
  it('renders component', () => {
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelMessageActions onResend={jest.fn()} />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})

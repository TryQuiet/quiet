import React from 'react'
import { shallow } from 'enzyme'

import { CreateChannelFormFinish } from './CreateChannelFormFinish'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../../theme'

describe('CreateChannelFormFinish', () => {
  it('renders component', () => {
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <CreateChannelFormFinish />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})

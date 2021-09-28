import React from 'react'
import { shallow } from 'enzyme'

import { CreateChannelForm } from './CreateChannelForm'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../../theme'

describe('CreateChannelForm', () => {
  it('renders component', () => {
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <CreateChannelForm
          onSubmit={jest.fn()}
          setStep={jest.fn()}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})

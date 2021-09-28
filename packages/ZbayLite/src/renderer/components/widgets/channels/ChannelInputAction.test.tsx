import React from 'react'
import { shallow } from 'enzyme'

import { ChannelInputAction } from './ChannelInputAction'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../../theme'

describe('ChannelInputAction', () => {
  it('renders component', () => {
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelInputAction
          onSendMoney={jest.fn()}
          disabled={false}
          targetRecipientAddress={''}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})

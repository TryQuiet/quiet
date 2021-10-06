import React from 'react'
import { shallow } from 'enzyme'

import { ChannelRegisteredMessage } from './ChannelRegisteredMessage'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../../theme'
import { createMessage } from '../../../testUtils'

describe('ChannelRegisteredMessage', async () => {
  it('renders component', async () => {
    const message = await createMessage()
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelRegisteredMessage
          username='testUsername'
          onChannelClick={() => { }}
          message={message}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})

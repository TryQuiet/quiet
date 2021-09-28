import React from 'react'
import { shallow } from 'enzyme'

import { ChannelRegisteredMessage } from './ChannelRegisteredMessage'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../../theme'
import { createMessage } from '../../../testUtils'
import { DisplayableMessage } from '../../../zbay/messages.types'

describe('ChannelRegisteredMessage', async () => {
  it('renders component', async () => {
    const message = await createMessage()
    const displayMessage = new DisplayableMessage(message)
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelRegisteredMessage
          username='testUsername'
          address='testAddress'
          onChannelClick={() => { }}
          message={displayMessage}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})

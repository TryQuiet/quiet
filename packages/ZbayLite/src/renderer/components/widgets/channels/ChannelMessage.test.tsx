import React from 'react'
import { DateTime } from 'luxon'
import { shallow } from 'enzyme'

import { ChannelMessage } from './ChannelMessage'
import { now, createMessage } from '../../../testUtils'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../../theme'
import { DisplayableMessage } from '../../../zbay/messages.types'

describe('ChannelMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
  })

  it('renders component', async () => {
    const message = await createMessage()
    const displayMessage = new DisplayableMessage(message)

    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelMessage
          message={displayMessage}
          onResend={jest.fn()}
          onLinkedChannel={jest.fn()}
          onLinkedUser={jest.fn()}
          openExternalLink={jest.fn()}
          setWhitelistAll={jest.fn()}
          addToWhitelist={jest.fn()}
          publicChannels={{}}
          users={{}}
          whitelisted={[]}
          autoload={[]}
          allowAll={false}
          torEnabled={true}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component when message is sent by owner', async () => {
    const message = await createMessage()
    const messageFromYou = {
      ...message,
      fromYou: true
    }
    const displayMessage = new DisplayableMessage(messageFromYou)

    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelMessage
          message={displayMessage}
          onResend={jest.fn()}
          onLinkedChannel={jest.fn()}
          onLinkedUser={jest.fn()}
          openExternalLink={jest.fn()}
          setWhitelistAll={jest.fn()}
          addToWhitelist={jest.fn()}
          publicChannels={{}}
          users={{}}
          whitelisted={[]}
          autoload={[]}
          allowAll={false}
          torEnabled={true}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})

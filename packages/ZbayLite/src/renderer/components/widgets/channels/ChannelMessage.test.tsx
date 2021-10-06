import React from 'react'
import { DateTime } from 'luxon'
import { shallow } from 'enzyme'

import { ChannelMessage } from './ChannelMessage'
import { now, createMessage } from '../../../testUtils'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../../theme'

describe('ChannelMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
  })

  it('renders component', async () => {
    const message = await createMessage()

    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelMessage
          message={message}
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

    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelMessage
          message={message}
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

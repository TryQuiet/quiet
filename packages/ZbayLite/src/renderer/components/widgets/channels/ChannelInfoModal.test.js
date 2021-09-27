import React from 'react'
import BigNumber from 'bignumber.js'
import { shallow } from 'enzyme'

import { ChannelInfoModal } from './ChannelInfoModal'
import { mockClasses } from '../../../../shared/testing/mocks'
import { createChannel } from '../../../testUtils'
import { DOMAIN } from '../../../../shared/static'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../../theme'

describe('ChannelInfoModal', () => {
  const uri = `https://${DOMAIN}/importchannel=channel-hash`
  it('renders component', () => {
    const channel = createChannel(1)
    channel.members = new BigNumber(2345)
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelInfoModal
          open
          classes={mockClasses}
          channel={channel}
          shareUri={uri}
          handleClose={jest.fn()}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component when closed', () => {
    const channel = createChannel(1)
    channel.members = new BigNumber(2345)
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelInfoModal
          classes={mockClasses}
          channel={channel}
          shareUri={uri}
          handleClose={jest.fn()}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})

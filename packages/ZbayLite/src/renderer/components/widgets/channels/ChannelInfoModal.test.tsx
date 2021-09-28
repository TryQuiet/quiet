import React from 'react'
import BigNumber from 'bignumber.js'
import { shallow } from 'enzyme'

import { ChannelInfoModal } from './ChannelInfoModal'
import { DOMAIN } from '../../../../shared/static'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../../theme'
import { Channel } from '../../../store/handlers/channel'

describe('ChannelInfoModal', () => {
  const uri = `https://${DOMAIN}/importchannel=channel-hash`
  it('renders component', () => {
    const channel = new Channel()
    const channelMembers = {
      ...channel,
      members: new BigNumber(2345)
    }

    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelInfoModal
          open
          channel={channelMembers}
          shareUri={uri}
          handleClose={jest.fn()}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component when closed', () => {
    const channel = new Channel()
    const channelMembers = {
      ...channel,
      members: new BigNumber(2345)
    }

    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelInfoModal
          channel={channelMembers}
          shareUri={uri}
          handleClose={jest.fn()}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})

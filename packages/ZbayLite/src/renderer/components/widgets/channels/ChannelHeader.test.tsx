import React from 'react'
import { shallow } from 'enzyme'

import { ChannelHeader } from './ChannelHeader'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../../theme'
import { Channel } from '../../../store/handlers/channel'
import { CHANNEL_TYPE } from '../../pages/ChannelTypes'

describe('ChannelHeader', () => {
  it('renders component', () => {
    const channel = new Channel()
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelHeader
          tab={0}
          setTab={() => { }}
          unmute={() => { }}
          mutedFlag
          channel={channel}
          name={'channel'}
          updateShowInfoMsg={jest.fn()}
          isRegisteredUsername
          directMessage={false}
          channelType={CHANNEL_TYPE.NORMAL}
          offer={''}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders without members count', () => {
    const channel = new Channel()
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelHeader
          tab={0}
          setTab={() => { }}
          channel={channel}
          unmute={() => { }}
          name={'channel'}
          updateShowInfoMsg={jest.fn()}
          mutedFlag
          isRegisteredUsername
          directMessage={false}
          channelType={CHANNEL_TYPE.NORMAL}
          offer={''}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders members when 0', () => {
    const channel = new Channel()
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelHeader
          tab={0}
          setTab={() => { }}
          channel={channel}
          name={'channel'}
          updateShowInfoMsg={jest.fn()}
          unmute={() => { }}
          mutedFlag
          isRegisteredUsername
          directMessage={false}
          channelType={CHANNEL_TYPE.NORMAL}
          offer={''}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})

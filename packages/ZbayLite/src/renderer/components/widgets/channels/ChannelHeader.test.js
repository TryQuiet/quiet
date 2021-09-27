import React from 'react'
import { shallow } from 'enzyme'

import { ChannelHeader } from './ChannelHeader'
import { mockClasses } from '../../../../shared/testing/mocks'
import { createChannel } from '../../../testUtils'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../../theme'

describe('ChannelHeader', () => {
  it('renders component', () => {
    const channel = createChannel(1)
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelHeader
          tab={0}
          setTab={() => { }}
          unmute={() => { }}
          mutedFlag
          classes={mockClasses}
          channel={channel}
          members={null}
          name={'channel'}
          updateShowInfoMsg={jest.fn()}
          isRegisteredUsername
          userAddress='test'
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders without members count', () => {
    const channel = createChannel(1)
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelHeader
          classes={mockClasses}
          tab={0}
          setTab={() => { }}
          channel={channel}
          members={new Set([1, 2, 3, 4])}
          unmute={() => { }}
          name={'channel'}
          updateShowInfoMsg={jest.fn()}
          mutedFlag
          userAddress='test'
          isRegisteredUsername
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders members when 0', () => {
    const channel = createChannel(1)
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelHeader
          classes={mockClasses}
          tab={0}
          setTab={() => { }}
          channel={channel}
          members={new Set()}
          name={'channel'}
          updateShowInfoMsg={jest.fn()}
          unmute={() => { }}
          mutedFlag
          userAddress='test'
          isRegisteredUsername
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})

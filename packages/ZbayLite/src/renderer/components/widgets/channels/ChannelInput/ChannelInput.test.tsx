import React from 'react'
import { shallow } from 'enzyme'
import theme from '../../../../theme'
import { ChannelInput } from './ChannelInput'
import { INPUT_STATE } from '../../../../store/selectors/channel'
import { MuiThemeProvider } from '@material-ui/core'

describe('ChannelInput', () => {
  it('renders component input available ', () => {
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelInput
          onChange={jest.fn()}
          setAnchorEl={jest.fn()}
          setMentionsToSelect={jest.fn()}
          onKeyPress={jest.fn()}
          message='this is just a test message'
          inputState={INPUT_STATE.AVAILABLE}
          channelName={'test'}
          users={{}}
          mentionsToSelect={[]}
          inputPlaceholder='test'
          isMessageTooLong={false}
          infoClass={''}
          setInfoClass={jest.fn()}
          id={''}
          anchorEl={''}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component input Disable ', () => {
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelInput
          onChange={jest.fn()}
          setAnchorEl={jest.fn()}
          setMentionsToSelect={jest.fn()}
          onKeyPress={jest.fn()}
          message='this is just a test message'
          inputState={INPUT_STATE.NOT_CONNECTED}
          channelName={'test'}
          mentionsToSelect={[]}
          users={{}}
          inputPlaceholder='test'
          isMessageTooLong={false}
          infoClass={''}
          setInfoClass={jest.fn()}
          id={''}
          anchorEl={''}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component input Locked ', () => {
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelInput
          onChange={jest.fn()}
          setAnchorEl={jest.fn()}
          setMentionsToSelect={jest.fn()}
          onKeyPress={jest.fn()}
          message='this is just a test message'
          inputState={INPUT_STATE.USER_NOT_REGISTERED}
          channelName={'test'}
          mentionsToSelect={[]}
          users={{}}
          inputPlaceholder='test'
          isMessageTooLong={false}
          infoClass={''}
          setInfoClass={jest.fn()}
          id={''}
          anchorEl={''}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})

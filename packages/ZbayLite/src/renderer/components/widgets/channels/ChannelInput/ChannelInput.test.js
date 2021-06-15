import React from 'react'
import { shallow } from 'enzyme'
import theme from '../../../../theme'
import { ChannelInput } from './ChannelInput'
import { INPUT_STATE } from '../../../../store/selectors/channel'

const appContext = React.createContext()

describe('ChannelInput', () => {
  it('renders component input available ', () => {
    const result = shallow(
      <appContext theme={theme}>
        <ChannelInput
          onChange={jest.fn()}
          setAnchorEl={jest.fn()}
          setMentionsToSelect={jest.fn()}
          onKeyPress={jest.fn()}
          message='this is just a test message'
          inputState={INPUT_STATE.AVAILABLE}
          channelName={'test'}
          messageLimit={200}
          users={{}}
          mentionsToSelect={[]}
          inputPlaceholder='test'
          isMessageTooLong={false}
        />
      </appContext>
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component input Disable ', () => {
    const result = shallow(
      <appContext theme={theme}>
        <ChannelInput
          onChange={jest.fn()}
          setAnchorEl={jest.fn()}
          setMentionsToSelect={jest.fn()}
          onKeyPress={jest.fn()}
          message='this is just a test message'
          inputState={INPUT_STATE.DISABLE}
          channelName={'test'}
          messageLimit={200}
          mentionsToSelect={[]}
          users={{}}
          inputPlaceholder='test'
          isMessageTooLong={false}
        />
      </appContext>
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component input Locked ', () => {
    const result = shallow(
      <appContext theme={theme}>
        <ChannelInput
          onChange={jest.fn()}
          setAnchorEl={jest.fn()}
          setMentionsToSelect={jest.fn()}
          onKeyPress={jest.fn()}
          message='this is just a test message'
          inputState={INPUT_STATE.LOCKED}
          channelName={'test'}
          messageLimit={200}
          mentionsToSelect={[]}
          users={{}}
          inputPlaceholder='test'
          isMessageTooLong={false}
        />
      </appContext>
    )
    expect(result).toMatchSnapshot()
  })
})

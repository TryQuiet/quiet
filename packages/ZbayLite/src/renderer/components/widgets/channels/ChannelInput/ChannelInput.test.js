import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../../../shared/testing/mocks'
import { ChannelInput } from './ChannelInput'
import { INPUT_STATE } from '../../../../store/selectors/channel'

describe('ChannelInput', () => {
  it('renders component input available ', () => {
    const result = shallow(
      <ChannelInput
        classes={mockClasses}
        onChange={jest.fn()}
        onKeyPress={jest.fn()}
        message='this is just a test message'
        inputState={INPUT_STATE.AVAILABLE}
        channelName={'test'}
        messageLimit={200}
      />
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component input Disable ', () => {
    const result = shallow(
      <ChannelInput
        classes={mockClasses}
        onChange={jest.fn()}
        onKeyPress={jest.fn()}
        message='this is just a test message'
        inputState={INPUT_STATE.DISABLE}
        channelName={'test'}
        messageLimit={200}
      />
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component input Locked ', () => {
    const result = shallow(
      <ChannelInput
        classes={mockClasses}
        onChange={jest.fn()}
        onKeyPress={jest.fn()}
        message='this is just a test message'
        inputState={INPUT_STATE.LOCKED}
        channelName={'test'}
        messageLimit={200}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

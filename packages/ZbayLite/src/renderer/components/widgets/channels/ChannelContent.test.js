import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'
import { ChannelContent } from './ChannelContent'
import { mockClasses } from '../../../../shared/testing/mocks'
import { CHANNEL_TYPE } from '../../pages/ChannelTypes'
describe('ChannelContent', () => {
  it('renders component', () => {
    const result = shallow(
      <ChannelContent
        channelType={CHANNEL_TYPE.NORMAL}
        classes={mockClasses}
        measureRef={jest.fn()}
        contentRect={{}}
        inputLocked
        mentions={Immutable.Map()}
        sendInvitation={jest.fn()}
        removeMention={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

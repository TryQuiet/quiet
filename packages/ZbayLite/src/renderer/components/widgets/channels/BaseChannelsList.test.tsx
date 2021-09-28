import React from 'react'
import { shallow } from 'enzyme'
import { BaseChannelsList } from './BaseChannelsList'
import { Contact } from '../../../store/handlers/contacts'

describe('BaseChannelsList', () => {
  it('renders component', () => {
    const channels = [new Contact()]
    const unknownMessages = [new Contact()]
    const directMessages = false
    const result = shallow(
      <BaseChannelsList
        channels={channels}
        unknownMessages={unknownMessages}
        directMessages={directMessages}
        selected={{}}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

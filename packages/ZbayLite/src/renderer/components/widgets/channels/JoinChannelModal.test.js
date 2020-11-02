import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../../shared/testing/mocks'
import { JoinChannelModal } from './JoinChannelModal'

describe('JoinChannelModal', () => {
  it('renders component', () => {
    const result = shallow(
      <JoinChannelModal
        open
        handleClose={() => {}}
        joinChannel={() => {}}
        showNotification={() => {}}
        publicChannels={{}}
        users={{}}
        classes={mockClasses}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

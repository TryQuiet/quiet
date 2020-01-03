import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'

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
        publicChannels={Immutable.Map({})}
        users={Immutable.Map({})}
        classes={mockClasses}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

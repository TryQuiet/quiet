import React from 'react'
import { shallow } from 'enzyme'

import { Notifications } from './Notifications'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('Notifications', () => {
  it('renders component', () => {
    const result = shallow(
      <Notifications
        classes={mockClasses}
        channelData={{ name: 'test' }}
        openNotificationsTab={() => {}}
        setChannelsNotification={() => {}}
        openSettingsModal={() => {}}
        currentFilter={1}
      />
    )
    expect(result).toMatchSnapshot()
  })
})

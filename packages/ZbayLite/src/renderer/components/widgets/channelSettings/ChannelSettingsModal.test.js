/* eslint import/first: 0 */
jest.mock('../../../containers/widgets/channelSettings/BlockedUsers', () => {
  const TabContent = () => <div>TabContent</div>
  return TabContent
})
jest.mock('../../../containers/widgets/channelSettings/Moderators', () => {
  const TabContent = () => <div>TabContent</div>
  return TabContent
})
import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'

import { ChannelSettingsModal } from './ChannelSettingsModal'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('ChannelSettingsModal', () => {
  it('renders component', () => {
    const result = shallow(
      <ChannelSettingsModal
        classes={mockClasses}
        channel={Immutable.Map({})}
        setCurrentTab={() => {}}
        handleClose={() => {}}
        currentTab='blockedUsers'
        open
      />
    )
    expect(result).toMatchSnapshot()
  })
})

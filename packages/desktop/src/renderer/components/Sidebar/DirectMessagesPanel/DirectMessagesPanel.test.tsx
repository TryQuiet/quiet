import React from 'react'
import { fireEvent } from '@testing-library/react'
import { ChannelType, type PublicChannelStorage, type UserProfile } from '@quiet/types'
import { renderComponent } from '../../../testUtils/renderComponent'
import DirectMessagesPanel from './DirectMessagesPanel'

it('keeps a replicated DM usable before its other participant profile arrives', () => {
  const me = { userId: 'alice', nickname: 'Alice' } as UserProfile
  const channel = {
    id: 'dm_test',
    type: ChannelType.DM,
    memberIds: ['alice', 'bob'],
    displayedName: 'bob',
  } as PublicChannelStorage
  const setCurrentChannel = jest.fn()
  const result = renderComponent(
    <DirectMessagesPanel
      myUserProfile={me}
      userProfiles={{ alice: me }}
      dmChannels={[channel]}
      unreadDms={[]}
      currentChannelId='general'
      connectedPeers={[]}
      isTorInitialized={true}
      setCurrentChannel={setCurrentChannel}
      openNewMessageWindow={jest.fn()}
    />
  )
  fireEvent.click(result.getByTestId('dm_test-dm-link'))
  expect(setCurrentChannel).toHaveBeenCalledWith('dm_test')
})

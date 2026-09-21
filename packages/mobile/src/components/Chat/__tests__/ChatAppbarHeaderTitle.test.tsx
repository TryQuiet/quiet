import React from 'react'
import { ChannelType } from '@quiet/types'

import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import { ChatAppbarHeaderTitle } from '../ChatAppbarHeaderTitle.component'

describe('ChatAppbarHeaderTitle', () => {
  // The design draws the channel's size under its name (Figma PVQ1Kjf6Cq8ng1czuVtvR8, 838:9711).
  const renderTitle = (memberCount?: number, isNewChat = false) =>
    renderComponent(
      <ChatAppbarHeaderTitle
        title={'updates'}
        isPublic={false}
        isNewChat={isNewChat}
        channelType={ChannelType.CHANNEL}
        memberCount={memberCount}
      />
    )

  it('draws the member count under the channel name', () => {
    const { queryByText } = renderTitle(32)

    expect(queryByText('updates')).not.toBeNull()
    expect(queryByText('32 members')).not.toBeNull()
  })

  it('uses the singular for a channel of one', () => {
    expect(renderTitle(1).queryByText('1 member')).not.toBeNull()
  })

  it('draws no meta line when there is no count', () => {
    expect(renderTitle(undefined).queryByTestId('chat-appbar-member-count')).toBeNull()
  })

  it('draws no meta line for a conversation being composed', () => {
    expect(renderTitle(undefined, true).queryByTestId('chat-appbar-member-count')).toBeNull()
  })
})

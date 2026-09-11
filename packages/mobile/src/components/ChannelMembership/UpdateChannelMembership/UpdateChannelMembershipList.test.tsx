import { UserProfile } from '@quiet/types'
import React from 'react'
import { TouchableOpacity } from 'react-native'

import { TAP_FEEDBACK_DELAY_MS } from '../../../utils/const/tapFeedback'
import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'

import { UpdateChannelMembershipList } from './UpdateChannelMembershipList.component'
import { SelectableListOption } from './UpdateChannelMembershipList.types'

// Issue #1495: rows inside a scrollable list must not dim while the list is
// being dragged, and the dim must not outlive the tap. Both requirements are
// expressed entirely through Pressability's two delay knobs, so pinning the
// props pins the motion -- see utils/const/tapFeedback.ts for the state-machine
// argument. The `delayPressIn` assertion is the one that fails on develop; the
// `delayPressOut` assertion guards behaviour that is already correct.
describe('UpdateChannelMembershipList tap feedback (#1495)', () => {
  const options: SelectableListOption[] = [
    { id: 'alice', label: 'alice', selected: false, index: 0, mutable: true, hide: false },
    { id: 'bob', label: 'bob', selected: true, index: 1, mutable: true, hide: false },
  ]

  const userProfiles: Record<string, UserProfile> = {
    alice: { userId: 'alice', nickname: 'alice' },
    bob: { userId: 'bob', nickname: 'bob' },
  }

  const rows = () =>
    renderComponent(
      <UpdateChannelMembershipList
        options={options}
        setOptions={jest.fn()}
        visibleOptionsIndices={new Set([0, 1])}
        userProfiles={userProfiles}
        channelId={'abc123'}
      />
    ).UNSAFE_getAllByType(TouchableOpacity)

  it('delays the press so dragging the member list never dims a row', () => {
    const members = rows()
    expect(members).toHaveLength(options.length)
    members.forEach(row => expect(row.props.delayPressIn).toBe(TAP_FEEDBACK_DELAY_MS))
  })

  it('keeps delayPressOut unset so the dim clears as soon as the tap ends', () => {
    rows().forEach(row => expect(row.props.delayPressOut).toBeUndefined())
  })
})

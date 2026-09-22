import React from 'react'
import { Animated } from 'react-native'
import { UserProfile } from '@quiet/types'

import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import { dragAway, hold, holdFor, holdSteadily, release } from '../../../utils/functions/pressGestures/pressGestures'
import { TAP_FEEDBACK_DELAY_MS } from '../../../utils/const/tapFeedback'
import { UpdateChannelMembershipList } from './UpdateChannelMembershipList.component'
import type { SelectableListOption } from './UpdateChannelMembershipList.types'
import type { DmChannelUserData } from '../../ProfilePhoto/ProfilePhoto.types'

const channelId = 'abc123'

const candidates: UserProfile[] = [
  { userId: 'foo-id', nickname: 'foo' },
  { userId: 'bar-id', nickname: 'bar' },
]

const nonMembers: Record<string, DmChannelUserData> = Object.fromEntries(
  candidates.map(user => [user.userId, { connected: false, user }])
)

const options: SelectableListOption[] = candidates.map((user, index) => ({
  id: user.userId,
  label: user.nickname,
  selected: false,
  index,
  mutable: true,
  hide: false,
}))

const rowTestId = (option: SelectableListOption) => `update-channel-membership-list-row-${channelId}-${option.id}`

const setup = (setOptions = jest.fn()) => {
  const rendered = renderComponent(
    <UpdateChannelMembershipList
      options={options}
      visibleOptionsIndices={new Set(options.map(option => option.index))}
      setOptions={setOptions}
      channelId={channelId}
      nonMembers={nonMembers}
    />
  )
  return { rendered, setOptions, row: rendered.getByTestId(rowTestId(options[0])) }
}

/**
 * The row is a `TouchableOpacity`, which dims by animating its opacity on the
 * native driver — a value that never reaches the test tree. So the dim is
 * watched where it begins: the `Animated.timing` call targeting the row's
 * active opacity.
 */
const ROW_ACTIVE_OPACITY = 0.2

const dimStarted = (timing: jest.SpyInstance) =>
  timing.mock.calls.some(call => (call[1] as { toValue?: number } | undefined)?.toValue === ROW_ACTIVE_OPACITY)

describe('UpdateChannelMembershipList', () => {
  it('renders one row per visible candidate', () => {
    const { rendered } = setup()
    expect(rendered.getByText('foo')).toBeTruthy()
    expect(rendered.getByText('bar')).toBeTruthy()
  })

  // #1495: the candidate list scrolls, and a row that dimmed the instant it was
  // touched dimmed at the start of every flick through it.
  describe('a row that a flick starts on', () => {
    let timing: jest.SpyInstance

    beforeEach(() => {
      jest.useFakeTimers()
      timing = jest.spyOn(Animated, 'timing')
    })

    afterEach(() => {
      timing.mockRestore()
      jest.useRealTimers()
    })

    it('stays undimmed while the touch could still turn into a scroll', () => {
      const { row } = setup()
      timing.mockClear()

      hold(row)
      holdFor(TAP_FEEDBACK_DELAY_MS - 1)
      expect(dimStarted(timing)).toBe(false)

      holdFor(1)
      expect(dimStarted(timing)).toBe(true)
    })

    it('never dims when the list takes the touch over', () => {
      const { row } = setup()
      timing.mockClear()

      hold(row)
      holdFor(TAP_FEEDBACK_DELAY_MS - 1)
      dragAway(row)
      expect(dimStarted(timing)).toBe(false)
    })

    // The delay must not swallow a real tap: picking a member still has to work
    // when the finger comes straight back up.
    it('still toggles the member when the tap is released inside the delay', () => {
      const { row, setOptions } = setup()

      hold(row)
      holdFor(TAP_FEEDBACK_DELAY_MS - 1)
      release(row)
      expect(setOptions).toHaveBeenCalled()
    })

    it('dims a deliberate press, which is what the feedback is for', () => {
      const { row } = setup()
      timing.mockClear()

      holdSteadily(row)
      expect(dimStarted(timing)).toBe(true)
    })
  })
})

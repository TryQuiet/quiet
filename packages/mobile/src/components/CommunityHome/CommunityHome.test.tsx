import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { dragAway, hold, holdFor, holdSteadily, release } from '../../utils/functions/pressGestures/pressGestures'
import { TAP_FEEDBACK_DELAY_MS } from '../../utils/const/tapFeedback'
import { CommunityHome } from './CommunityHome.component'
import { LIST_TEXT_OPACITY } from './ListRow.component'

import type { CommunityHomeChannel, CommunityHomeProps, CommunityHomeUser } from './CommunityHome.types'

const channels: CommunityHomeChannel[] = [
  { id: 'general-id', name: 'general', isPublic: true, unread: false },
  { id: 'bug-reporting-id', name: 'bug-reporting', isPublic: true, unread: true },
  { id: 'philosophy-id', name: 'philosophy', isPublic: false, unread: false },
]

const users: CommunityHomeUser[] = [
  { userId: 'stone-jump', nickname: 'StoneJump', connected: true },
  { userId: 'moon-thinke', nickname: 'MoonThinke8', connected: false },
]

const setup = (overrides: Partial<CommunityHomeProps> = {}) => {
  const props: CommunityHomeProps = {
    communityName: 'Nyc-activism',
    channels,
    users,
    canCreateChannel: true,
    openCommunityMenu: jest.fn(),
    addMembers: jest.fn(),
    createChannel: jest.fn(),
    openChannel: jest.fn(),
    openMember: jest.fn(),
    startDm: jest.fn(),
    ...overrides,
  }
  return { props, ...renderComponent(<CommunityHome {...props} />) }
}

describe('CommunityHome component', () => {
  it('matches the snapshot', () => {
    const { toJSON } = setup()
    expect(toJSON()).toMatchSnapshot()
  })

  it('lists every channel and member, and no message previews', () => {
    const { getByText } = setup()
    expect(getByText('Add members')).toBeTruthy()
    expect(getByText('Channels')).toBeTruthy()
    expect(getByText('general')).toBeTruthy()
    expect(getByText('philosophy')).toBeTruthy()
    expect(getByText('Direct messages')).toBeTruthy()
    expect(getByText('StoneJump')).toBeTruthy()
  })

  it('messages a member by user id, since a member row now opens a DM', () => {
    const { props, getByTestId } = setup()
    fireEvent.press(getByTestId('user_tile_StoneJump'))
    expect(props.openMember).toHaveBeenCalledWith('stone-jump')
  })

  it('starts a conversation from the Direct messages plus', () => {
    const { props, getByTestId } = setup()
    fireEvent.press(getByTestId('Start dm'))
    expect(props.startDm).toHaveBeenCalled()
  })

  // The frame draws `t-add` on both `List title` instances (Channels 6220:10615, Direct messages
  // 6220:10876). Creating a channel is permission-gated; messaging someone is not.
  it('keeps the Direct messages plus without the channel-creation permission', () => {
    const { props, getByTestId, queryByTestId } = setup({ canCreateChannel: false })
    expect(queryByTestId('Create channel')).toBeNull()
    fireEvent.press(getByTestId('Start dm'))
    expect(props.startDm).toHaveBeenCalled()
  })

  // The row/title ink the mobile frame specifies: #222222 at 70%, which reads as #656565 over the
  // white card. Solid ink is wrong here, and so is the dark sidebar's white.
  it('draws list text at the frame ink, not solid', () => {
    const { getByText } = setup()
    for (const label of ['Add members', 'Channels', 'general', 'Direct messages', 'StoneJump']) {
      expect(getByText(label)).toHaveStyle({ opacity: LIST_TEXT_OPACITY, color: '#222222' })
    }
    expect(LIST_TEXT_OPACITY).toBe(0.7)
  })

  it('opens a channel by id', () => {
    const { props, getByTestId } = setup()
    fireEvent.press(getByTestId('channel_tile_general'))
    expect(props.openChannel).toHaveBeenCalledWith('general-id')
  })

  it('opens the invitation flow from the Add members row', () => {
    const { props, getByTestId } = setup()
    fireEvent.press(getByTestId('Add members'))
    expect(props.addMembers).toHaveBeenCalled()
  })

  it('opens the community menu from the title bar', () => {
    const { props, getByTestId } = setup()
    fireEvent.press(getByTestId('open_menu'))
    expect(props.openCommunityMenu).toHaveBeenCalled()
  })

  it('shows the create-channel plus only with the permission', () => {
    const withPermission = setup()
    fireEvent.press(withPermission.getByTestId('Create channel'))
    expect(withPermission.props.createChannel).toHaveBeenCalled()

    const withoutPermission = setup({ canCreateChannel: false })
    expect(withoutPermission.queryByTestId('Create channel')).toBeNull()
  })

  it('marks unread channels and the community, but never invents a count', () => {
    const { getByTestId, queryByTestId, getByText } = setup()
    expect(getByTestId('channel_tile_bug-reporting_unread')).toBeTruthy()
    expect(queryByTestId('channel_tile_general_unread')).toBeNull()
    expect(getByTestId('community_unread')).toBeTruthy()
    // No unread count exists in the store, so no number is rendered.
    expect(() => getByText('1')).toThrow()
  })

  // A conversation is not a channel row, so the frame's `badge2` on `List item--people` is the only
  // place its unread mark can go, and it has to reach the community badge too.
  it('marks a member row whose conversation is unread, and the community with it', () => {
    const allRead = channels.map(channel => ({ ...channel, unread: false }))
    const quiet = setup({ channels: allRead })
    expect(quiet.queryByTestId('user_tile_StoneJump_unread')).toBeNull()
    expect(quiet.queryByTestId('community_unread')).toBeNull()

    const withUnreadDm = setup({
      channels: allRead,
      users: [{ ...users[0], unread: true }, users[1]],
    })
    expect(withUnreadDm.getByTestId('user_tile_StoneJump_unread')).toBeTruthy()
    expect(withUnreadDm.queryByTestId('user_tile_MoonThinke8_unread')).toBeNull()
    expect(withUnreadDm.getByTestId('community_unread')).toBeTruthy()
  })

  it('leaves the community unmarked when nothing is unread', () => {
    const { queryByTestId } = setup({ channels: channels.map(channel => ({ ...channel, unread: false })) })
    expect(queryByTestId('community_unread')).toBeNull()
  })

  // The empty community (6124:9816) draws no member section at all.
  it('hides the members section until profiles arrive', () => {
    const { queryByText } = setup({ users: [] })
    expect(queryByText('Direct messages')).toBeNull()
  })

  it('labels yourself in the member list, which includes you', () => {
    const { getByText } = setup({ users: [{ ...users[0], isMe: true }] })
    expect(getByText('you')).toBeTruthy()
  })

  // "Tapped state for all clickable stuff" — the designer's V1 note 6220:24045.
  describe('tapped states', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())

    it('fills a channel row while it is held', () => {
      const { getByTestId } = setup()
      const row = getByTestId('channel_tile_general')
      expect(row).toHaveStyle({ backgroundColor: 'transparent' })
      holdSteadily(row)
      expect(row).toHaveStyle({ backgroundColor: '#F0F0F0' })
      release(row)
      expect(row).toHaveStyle({ backgroundColor: 'transparent' })
    })

    it('fills the Add members row and the create-channel circle while they are held', () => {
      const { getByTestId } = setup()
      const addMembers = getByTestId('Add members')
      holdSteadily(addMembers)
      expect(addMembers).toHaveStyle({ backgroundColor: '#F0F0F0' })

      // The plus keeps its 16px box so the frame's right margin holds; the
      // tapped disc is a wider circle behind it.
      const { getByTestId: q, queryByTestId } = setup()
      expect(queryByTestId('Create channel_pressed')).toBeNull()
      holdSteadily(q('Create channel'))
      expect(q('Create channel_pressed')).toHaveStyle({ backgroundColor: '#F0F0F0', borderRadius: 14 })
    })

    it('overlays the title bar group in white at 10% while it is held', () => {
      const { getByTestId } = setup()
      const group = getByTestId('open_menu')
      // The title bar is fixed, not scrollable, so it fills on contact.
      hold(group)
      expect(group).toHaveStyle({ backgroundColor: 'rgba(255, 255, 255, 0.10)' })
      release(group)
      expect(group).toHaveStyle({ backgroundColor: 'transparent' })
    })

    // #1495: the card is one scroll view, so every row is also the surface you
    // drag to scroll. A row that lit up on contact lit up at the start of every
    // flick — feedback for a tap nobody made.
    it('leaves a row unfilled while the touch could still turn into a scroll', () => {
      const { getByTestId } = setup()
      const row = getByTestId('channel_tile_general')
      hold(row)
      holdFor(TAP_FEEDBACK_DELAY_MS - 1)
      expect(row).toHaveStyle({ backgroundColor: 'transparent' })
      holdFor(1)
      expect(row).toHaveStyle({ backgroundColor: '#F0F0F0' })
    })

    // The flash is between the finger landing and the list claiming the touch,
    // so that is where this looks; by the time the list has claimed it the row
    // has been deactivated either way and there is nothing left to see.
    it('never fills a row the list takes over for a flick', () => {
      const { getByTestId } = setup()
      const row = getByTestId('channel_tile_general')
      hold(row)
      holdFor(TAP_FEEDBACK_DELAY_MS - 1)
      expect(row).toHaveStyle({ backgroundColor: 'transparent' })
      dragAway(row)
      expect(row).toHaveStyle({ backgroundColor: 'transparent' })
    })

    it('never fills a member row the list takes over for a flick', () => {
      const { getByTestId } = setup()
      const row = getByTestId('user_tile_StoneJump')
      hold(row)
      holdFor(TAP_FEEDBACK_DELAY_MS - 1)
      expect(row).toHaveStyle({ backgroundColor: 'transparent' })
      dragAway(row)
      expect(row).toHaveStyle({ backgroundColor: 'transparent' })
    })

    it('never fills the create-channel circle the list takes over for a flick', () => {
      const { getByTestId, queryByTestId } = setup()
      hold(getByTestId('Create channel'))
      holdFor(TAP_FEEDBACK_DELAY_MS - 1)
      expect(queryByTestId('Create channel_pressed')).toBeNull()
      dragAway(getByTestId('Create channel'))
      expect(queryByTestId('Create channel_pressed')).toBeNull()
    })

    // The delay must not swallow a real tap: Pressability activates and
    // deactivates on release when the delay never ran, then fires onPress.
    it('opens a channel tapped and released inside the delay', () => {
      const { props, getByTestId } = setup()
      const row = getByTestId('channel_tile_general')
      hold(row)
      holdFor(TAP_FEEDBACK_DELAY_MS - 1)
      release(row)
      expect(props.openChannel).toHaveBeenCalledWith('general-id')
      expect(row).toHaveStyle({ backgroundColor: 'transparent' })
    })

    it('fills a member row while it is held, now that it opens a DM', () => {
      const { getByTestId } = setup()
      const row = getByTestId('user_tile_StoneJump')
      expect(row).toHaveStyle({ backgroundColor: 'transparent' })
      holdSteadily(row)
      expect(row).toHaveStyle({ backgroundColor: '#F0F0F0' })
      release(row)
      expect(row).toHaveStyle({ backgroundColor: 'transparent' })
    })
  })

  it('shows the connecting placeholder before any channel is known', () => {
    const { getByText, queryByTestId } = setup({ channels: [] })
    expect(getByText('Connecting to peers')).toBeTruthy()
    expect(queryByTestId('channels_list')).toBeNull()
  })
})

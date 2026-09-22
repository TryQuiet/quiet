import React from 'react'
import type { ReactTestInstance } from 'react-test-renderer'
import { act, fireEvent } from '@testing-library/react-native'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { CommunityHome } from './CommunityHome.component'

import { ChannelType, type PublicChannelStorage } from '@quiet/types'

import type { CommunityHomeChannel, CommunityHomeConversation, CommunityHomeProps } from './CommunityHome.types'

const channels: CommunityHomeChannel[] = [
  { id: 'general-id', name: 'general', isPublic: true, unread: false },
  { id: 'bug-reporting-id', name: 'bug-reporting', isPublic: true, unread: true },
  { id: 'philosophy-id', name: 'philosophy', isPublic: false, unread: false },
]

const dmChannel = (id: string, name: string): PublicChannelStorage =>
  ({
    id,
    name,
    displayedName: name,
    type: ChannelType.DM,
    memberIds: ['me', id],
  }) as unknown as PublicChannelStorage

const conversations: CommunityHomeConversation[] = [
  {
    id: 'stone-jump-dm',
    name: 'StoneJump',
    unread: false,
    channel: dmChannel('stone-jump-dm', 'StoneJump'),
    userData: { connected: true, user: { userId: 'stone-jump', nickname: 'StoneJump' } as never },
  },
  {
    id: 'moon-thinke-dm',
    name: 'MoonThinke8',
    unread: true,
    channel: dmChannel('moon-thinke-dm', 'MoonThinke8'),
    userData: { connected: false, user: { userId: 'moon-thinke', nickname: 'MoonThinke8' } as never },
  },
]

const setup = (overrides: Partial<CommunityHomeProps> = {}) => {
  const props: CommunityHomeProps = {
    communityName: 'Nyc-activism',
    channels,
    conversations,
    canCreateChannel: true,
    openCommunityMenu: jest.fn(),
    addMembers: jest.fn(),
    createChannel: jest.fn(),
    createDm: jest.fn(),
    openChannel: jest.fn(),
    ...overrides,
  }
  return { props, ...renderComponent(<CommunityHome {...props} />) }
}

/**
 * `Pressable`'s pressed state is driven by the responder system, not by an
 * `onPressIn` prop, so a press is held by granting the responder and released
 * by giving it back — the same pair RNTL's own `userEvent.press` dispatches.
 * Pressability reads `persist` and `currentTarget.measure` off the event, so
 * the stub carries them.
 */
const touchEvent = (registrationName: string) => ({
  target: {},
  preventDefault: () => undefined,
  isDefaultPrevented: () => false,
  stopPropagation: () => undefined,
  isPropagationStopped: () => false,
  persist: () => undefined,
  isPersistent: () => false,
  timeStamp: 0,
  nativeEvent: {
    changedTouches: [],
    identifier: 0,
    locationX: 0,
    locationY: 0,
    pageX: 0,
    pageY: 0,
    target: 0,
    timestamp: Date.now(),
    touches: [],
  },
  currentTarget: { measure: () => undefined },
  dispatchConfig: { registrationName },
})

const hold = (element: ReactTestInstance) => fireEvent(element, 'responderGrant', touchEvent('onResponderGrant'))

/**
 * Pressability holds the pressed look for a minimum 130ms after the finger
 * lifts, so the release only lands once the timers have run.
 */
const release = (element: ReactTestInstance) => {
  fireEvent(element, 'responderRelease', touchEvent('onResponderRelease'))
  act(() => {
    jest.advanceTimersByTime(200)
  })
}

describe('CommunityHome component', () => {
  it('matches the snapshot', () => {
    const { toJSON } = setup()
    expect(toJSON()).toMatchSnapshot()
  })

  it('lists every channel and conversation, and no message previews', () => {
    const { getByText } = setup()
    expect(getByText('Add members')).toBeTruthy()
    expect(getByText('Channels')).toBeTruthy()
    expect(getByText('general')).toBeTruthy()
    expect(getByText('philosophy')).toBeTruthy()
    expect(getByText('Direct messages')).toBeTruthy()
    expect(getByText('StoneJump')).toBeTruthy()
  })

  it('opens a conversation by its channel id', () => {
    const { props, getByTestId } = setup()
    fireEvent.press(getByTestId('dm_tile_StoneJump'))
    expect(props.openChannel).toHaveBeenCalledWith('stone-jump-dm')
  })

  it('starts a new direct message from the section plus', () => {
    const { props, getByTestId } = setup()
    fireEvent.press(getByTestId('New direct message'))
    expect(props.createDm).toHaveBeenCalled()
  })

  it('marks an unread conversation, and the community with it', () => {
    const { getByTestId, queryByTestId } = setup({ channels: channels.map(c => ({ ...c, unread: false })) })
    expect(getByTestId('dm_tile_MoonThinke8_unread')).toBeTruthy()
    expect(queryByTestId('dm_tile_StoneJump_unread')).toBeNull()
    // Nothing else is unread, so the community mark comes from the conversation.
    expect(getByTestId('community_unread')).toBeTruthy()
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

  it('leaves the community unmarked when nothing is unread', () => {
    const { queryByTestId } = setup({
      channels: channels.map(channel => ({ ...channel, unread: false })),
      conversations: conversations.map(conversation => ({ ...conversation, unread: false })),
    })
    expect(queryByTestId('community_unread')).toBeNull()
  })

  it('keeps the Direct messages section and its plus with no conversations yet', () => {
    const { getByText, getByTestId } = setup({ conversations: [] })
    expect(getByText('Direct messages')).toBeTruthy()
    expect(getByTestId('New direct message')).toBeTruthy()
  })

  // "Tapped state for all clickable stuff" — the designer's V1 note 6220:24045.
  describe('tapped states', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())

    it('fills a channel row while it is held', () => {
      const { getByTestId } = setup()
      const row = getByTestId('channel_tile_general')
      expect(row).toHaveStyle({ backgroundColor: 'transparent' })
      hold(row)
      expect(row).toHaveStyle({ backgroundColor: '#F0F0F0' })
      release(row)
      expect(row).toHaveStyle({ backgroundColor: 'transparent' })
    })

    it('fills the Add members row and the create-channel circle while they are held', () => {
      const { getByTestId } = setup()
      const addMembers = getByTestId('Add members')
      hold(addMembers)
      expect(addMembers).toHaveStyle({ backgroundColor: '#F0F0F0' })

      // The plus keeps its 16px box so the frame's right margin holds; the
      // tapped disc is a wider circle behind it.
      const { getByTestId: q, queryByTestId } = setup()
      expect(queryByTestId('Create channel_pressed')).toBeNull()
      hold(q('Create channel'))
      expect(q('Create channel_pressed')).toHaveStyle({ backgroundColor: '#F0F0F0', borderRadius: 14 })
    })

    it('overlays the title bar group in white at 10% while it is held', () => {
      const { getByTestId } = setup()
      const group = getByTestId('open_menu')
      hold(group)
      expect(group).toHaveStyle({ backgroundColor: 'rgba(255, 255, 255, 0.10)' })
      release(group)
      expect(group).toHaveStyle({ backgroundColor: 'transparent' })
    })

    it('fills a conversation row while it is held, now that it opens something', () => {
      const { getByTestId } = setup()
      const row = getByTestId('dm_tile_StoneJump')
      expect(row).toHaveStyle({ backgroundColor: 'transparent' })
      hold(row)
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

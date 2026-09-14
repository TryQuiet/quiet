import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { CommunityHome } from './CommunityHome.component'

import type { CommunityHomeChannel, CommunityHomeProps, CommunityHomeUser } from './CommunityHome.types'

const channels: CommunityHomeChannel[] = [
  { id: 'general-id', name: 'general', isPublic: true, unread: false },
  { id: 'bug-reporting-id', name: 'bug-reporting', isPublic: true, unread: true },
  { id: 'philosophy-id', name: 'philosophy', isPublic: false, unread: false },
]

const users: CommunityHomeUser[] = [
  { userId: 'stone-jump', nickname: 'StoneJump' },
  { userId: 'moon-thinke', nickname: 'MoonThinke8' },
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
    const { getByText, queryByText } = setup()
    expect(getByText('Add members')).toBeTruthy()
    expect(getByText('Channels')).toBeTruthy()
    expect(getByText('general')).toBeTruthy()
    expect(getByText('philosophy')).toBeTruthy()
    expect(getByText('Users')).toBeTruthy()
    expect(getByText('StoneJump')).toBeTruthy()
    // The design's "Direct messages" heading is not used — Quiet has no DMs.
    expect(queryByText('Direct messages')).toBeNull()
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
    const { queryByTestId } = setup({ channels: channels.map(channel => ({ ...channel, unread: false })) })
    expect(queryByTestId('community_unread')).toBeNull()
  })

  it('hides the members section until profiles arrive', () => {
    const { queryByText } = setup({ users: [] })
    expect(queryByText('Users')).toBeNull()
  })

  it('shows the connecting placeholder before any channel is known', () => {
    const { getByText, queryByTestId } = setup({ channels: [] })
    expect(getByText('Connecting to peers')).toBeTruthy()
    expect(queryByTestId('channels_list')).toBeNull()
  })
})

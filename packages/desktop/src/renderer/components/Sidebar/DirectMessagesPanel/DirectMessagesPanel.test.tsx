import React from 'react'
import { cleanup, fireEvent } from '@testing-library/react'
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
      isUserConnected={() => false}
      isTorInitialized={true}
      setCurrentChannel={setCurrentChannel}
      openNewMessageWindow={jest.fn()}
    />
  )
  fireEvent.click(result.getByTestId('dm_test-dm-link'))
  expect(setCurrentChannel).toHaveBeenCalledWith('dm_test')
})

/**
 * Presence is a property of the user, not of a peer: a DM row is lit when the other participant is
 * reachable on ANY of their devices. The badge is drawn by ProfilePhotoWithBadge and carries
 * MuiBadge-invisible when it is off.
 */
describe('DM row presence', () => {
  afterEach(cleanup)

  const me = { userId: 'alice', nickname: 'Alice' } as UserProfile
  const bob = { userId: 'bob', nickname: 'Bob' } as UserProfile
  const carol = { userId: 'carol', nickname: 'Carol' } as UserProfile

  const dm = (id: string, memberIds: string[]): PublicChannelStorage =>
    ({ id, type: ChannelType.DM, memberIds, displayedName: id }) as PublicChannelStorage

  const renderPanel = (
    channel: PublicChannelStorage,
    isUserConnected: (userId: string | undefined) => boolean,
    isTorInitialized = true
  ) =>
    renderComponent(
      <DirectMessagesPanel
        myUserProfile={me}
        userProfiles={{ alice: me, bob, carol }}
        dmChannels={[channel]}
        unreadDms={[]}
        currentChannelId='general'
        isUserConnected={isUserConnected}
        isTorInitialized={isTorInitialized}
        setCurrentChannel={jest.fn()}
        openNewMessageWindow={jest.fn()}
      />
    )

  const badgeOf = (result: ReturnType<typeof renderComponent>, channelId: string) =>
    result.getByTestId(`${channelId}-profile-photo-status-badge`)

  it('lights a one-to-one DM when the other participant is online', () => {
    const result = renderPanel(dm('dm_bob', ['alice', 'bob']), userId => userId === 'bob')
    expect(badgeOf(result, 'dm_bob').className).not.toContain('MuiBadge-invisible')
  })

  it('leaves a one-to-one DM dark when the other participant is offline', () => {
    const result = renderPanel(dm('dm_bob', ['alice', 'bob']), () => false)
    expect(badgeOf(result, 'dm_bob').className).toContain('MuiBadge-invisible')
  })

  it('does not light a DM because I am online', () => {
    const result = renderPanel(dm('dm_bob', ['alice', 'bob']), userId => userId === 'alice')
    expect(badgeOf(result, 'dm_bob').className).toContain('MuiBadge-invisible')
  })

  it('lights the conversation with myself while Tor is up', () => {
    const result = renderPanel(dm('dm_self', ['alice']), () => false, true)
    expect(badgeOf(result, 'dm_self').className).not.toContain('MuiBadge-invisible')
  })

  it('darkens the conversation with myself while Tor is down', () => {
    const result = renderPanel(dm('dm_self', ['alice']), () => false, false)
    expect(badgeOf(result, 'dm_self').className).toContain('MuiBadge-invisible')
  })

  it('shows a group DM as a member count rather than a presence dot', () => {
    const result = renderPanel(dm('dm_group', ['alice', 'bob', 'carol']), userId => userId === 'carol')
    const badge = badgeOf(result, 'dm_group')
    expect(badge.className).not.toContain('MuiBadge-invisible')
    expect(badge.textContent).toEqual('2')
  })
})

/**
 * A channel row and a DM row sit in the same column, so unread has to look the same on both: the
 * library gives an unread row `badge2` at its right edge as well as the heavier label.
 */
describe('DM row unread', () => {
  afterEach(cleanup)

  const me = { userId: 'alice', nickname: 'Alice' } as UserProfile
  const bob = { userId: 'bob', nickname: 'Bob' } as UserProfile

  const dm = (id: string): PublicChannelStorage =>
    ({ id, type: ChannelType.DM, memberIds: ['alice', 'bob'], displayedName: id }) as PublicChannelStorage

  const renderPanel = (unreadDms: string[]) =>
    renderComponent(
      <DirectMessagesPanel
        myUserProfile={me}
        userProfiles={{ alice: me, bob }}
        dmChannels={[dm('dm_bob')]}
        unreadDms={unreadDms}
        currentChannelId='general'
        isUserConnected={() => false}
        isTorInitialized={true}
        setCurrentChannel={jest.fn()}
        openNewMessageWindow={jest.fn()}
      />
    )

  it('marks an unread conversation with the badge as well as the label', () => {
    const result = renderPanel(['dm_bob'])

    expect(result.queryByTestId('dm_bob-dm-link-unread')).not.toBeNull()
    expect(result.getByTestId('dm_bob-dm-link-text').className).toContain('SidebarRowunread')
  })

  it('leaves a read conversation unbadged', () => {
    const result = renderPanel([])

    expect(result.queryByTestId('dm_bob-dm-link-unread')).toBeNull()
    expect(result.getByTestId('dm_bob-dm-link-text').className).not.toContain('SidebarRowunread')
  })
})

/**
 * Only the conversation with yourself is annotated, and the annotation is a separate element beside
 * the name rather than part of it, so a long name truncates without taking the annotation with it.
 */
describe('DM row "you" annotation', () => {
  afterEach(cleanup)

  const me = { userId: 'alice', nickname: 'Alice' } as UserProfile
  const bob = { userId: 'bob', nickname: 'Bob' } as UserProfile

  const renderPanel = (memberIds: string[], id: string) =>
    renderComponent(
      <DirectMessagesPanel
        myUserProfile={me}
        userProfiles={{ alice: me, bob }}
        dmChannels={[{ id, type: ChannelType.DM, memberIds, displayedName: id } as PublicChannelStorage]}
        unreadDms={[]}
        currentChannelId='general'
        isUserConnected={() => false}
        isTorInitialized={true}
        setCurrentChannel={jest.fn()}
        openNewMessageWindow={jest.fn()}
      />
    )

  it('annotates the conversation with myself', () => {
    const result = renderPanel(['alice'], 'dm_self')

    expect(result.getByTestId('dm-link-text-me').textContent).toEqual('you')
  })

  it('leaves a conversation with someone else unannotated', () => {
    const result = renderPanel(['alice', 'bob'], 'dm_bob')

    expect(result.queryByTestId('dm-link-text-me')).toBeNull()
  })
})

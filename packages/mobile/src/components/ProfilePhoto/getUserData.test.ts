import { ChannelType, type PublicChannelStorage, type UserProfile } from '@quiet/types'
import { getUserData } from './ProfilePhotoWithBadge.component'

/**
 * The mobile sidebar avatar shows ONE participant of a DM, and presence used to be read off that
 * one person. A group conversation was therefore shown offline whenever the pictured member
 * happened to be, even with everyone else online. Presence belongs to the conversation.
 */
const profile = (userId: string, nickname: string): UserProfile => ({ userId, nickname } as UserProfile)

const ME = profile('me', 'Me')
const BOB = profile('bob', 'Bob')
const CAROL = profile('carol', 'Carol')
const userProfiles = { me: ME, bob: BOB, carol: CAROL }

const dm = (memberIds: string[]): PublicChannelStorage =>
  ({ id: 'dm', type: ChannelType.DM, memberIds } as PublicChannelStorage)

const online =
  (...ids: string[]) =>
  (userId: string | undefined) =>
    userId != null && ids.includes(userId)

describe('getUserData', () => {
  it('follows the other person in a one-to-one', () => {
    expect(getUserData(dm(['me', 'bob']), online('bob'), true, userProfiles, ME)?.connected).toBe(true)
    expect(getUserData(dm(['me', 'bob']), online(), true, userProfiles, ME)?.connected).toBe(false)
  })

  it('follows ANY other participant of a group, not the one pictured', () => {
    const channel = dm(['me', 'bob', 'carol'])
    // Bob is the member the avatar shows, and Bob is offline.
    expect(getUserData(channel, online(), true, userProfiles, ME)?.user.userId).toEqual('bob')
    expect(getUserData(channel, online('carol'), true, userProfiles, ME)?.connected).toBe(true)
    expect(getUserData(channel, online('bob'), true, userProfiles, ME)?.connected).toBe(true)
    expect(getUserData(channel, online(), true, userProfiles, ME)?.connected).toBe(false)
  })

  it('does not count my own connection', () => {
    expect(getUserData(dm(['me', 'bob']), online('me'), true, userProfiles, ME)?.connected).toBe(false)
  })

  it('follows Tor for the conversation with myself', () => {
    expect(getUserData(dm(['me']), online(), true, userProfiles, ME)?.connected).toBe(true)
    expect(getUserData(dm(['me']), online('me'), false, userProfiles, ME)?.connected).toBe(false)
  })

  it('ignores anything that is not a DM', () => {
    const channel = { id: 'general', type: ChannelType.CHANNEL, memberIds: ['me'] } as PublicChannelStorage
    expect(getUserData(channel, online('bob'), true, userProfiles, ME)).toBeUndefined()
  })
})

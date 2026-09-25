import { ChannelType, type UserProfile } from '@quiet/types'

import { getChannelMembers, getChannelNonMembers } from './channelMembers'

const profile = (userId: string, channels?: string[]): UserProfile => ({ userId, nickname: userId, channels })

const ids = (profiles: UserProfile[]): string[] => profiles.map(p => p.userId).sort()

describe('getChannelMembers', () => {
  const userProfiles: Record<string, UserProfile> = {
    alice: profile('alice', ['priv']),
    bob: profile('bob', ['priv', 'other']),
    carol: profile('carol', ['other']),
    dave: profile('dave'),
  }

  it('is the whole community for a public channel', () => {
    expect(ids(getChannelMembers({ id: 'general', public: true }, userProfiles))).toEqual([
      'alice',
      'bob',
      'carol',
      'dave',
    ])
  })

  it('treats a channel with no explicit privacy as public', () => {
    expect(getChannelMembers({ id: 'general' }, userProfiles)).toHaveLength(4)
  })

  // #3691: a private channel has no memberIds; it must not fall back to the whole community.
  it('is only the profiles that list a private channel', () => {
    const channel = { id: 'priv', public: false, type: ChannelType.CHANNEL }
    expect(ids(getChannelMembers(channel, userProfiles))).toEqual(['alice', 'bob'])
  })

  it('is nobody for a private channel no profile lists yet', () => {
    expect(getChannelMembers({ id: 'fresh', public: false }, userProfiles)).toEqual([])
  })

  it('is the participant list for a DM, ignoring profile.channels', () => {
    const dm = { id: 'priv', type: ChannelType.DM, public: false, memberIds: ['carol', 'dave'] }
    expect(ids(getChannelMembers(dm, userProfiles))).toEqual(['carol', 'dave'])
  })

  it('keeps a DM in participant order, once each', () => {
    const dm = { id: 'dm', type: ChannelType.DM, memberIds: ['dave', 'alice', 'dave'] }
    expect(getChannelMembers(dm, userProfiles).map(p => p.userId)).toEqual(['dave', 'alice'])
  })

  it('drops DM participants whose profile has not arrived yet', () => {
    const dm = { id: 'dm', type: ChannelType.DM, memberIds: ['alice', 'unknown'] }
    expect(ids(getChannelMembers(dm, userProfiles))).toEqual(['alice'])
  })

  it('is nobody without a channel', () => {
    expect(getChannelMembers(undefined, userProfiles)).toEqual([])
  })
})

describe('getChannelNonMembers', () => {
  const userProfiles: Record<string, UserProfile> = {
    alice: profile('alice', ['priv']),
    bob: profile('bob', ['priv']),
    carol: profile('carol', ['other']),
    dave: profile('dave'),
  }

  it("is the community minus a private channel's members", () => {
    expect(ids(getChannelNonMembers({ id: 'priv', public: false }, userProfiles))).toEqual(['carol', 'dave'])
  })

  it('is nobody for a public channel', () => {
    expect(getChannelNonMembers({ id: 'general', public: true }, userProfiles)).toEqual([])
  })

  it('is the whole community for a private channel nobody lists yet', () => {
    expect(getChannelNonMembers({ id: 'fresh', public: false }, userProfiles)).toHaveLength(4)
  })

  it('partitions the community with getChannelMembers', () => {
    const channel = { id: 'priv', public: false }
    const members = ids(getChannelMembers(channel, userProfiles))
    const others = ids(getChannelNonMembers(channel, userProfiles))
    expect([...members, ...others].sort()).toEqual(Object.keys(userProfiles).sort())
    expect(members.filter(id => others.includes(id))).toEqual([])
  })
})

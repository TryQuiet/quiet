import { ChannelType, type UserProfile } from '@quiet/types'

import { countChannelMembers, memberCountLabel } from './channelMembers'

const profile = (userId: string, channels: string[] = []): UserProfile =>
  ({ userId, nickname: userId, channels } as UserProfile)

describe('countChannelMembers', () => {
  const userProfiles: Record<string, UserProfile> = {
    alice: profile('alice', ['priv']),
    bob: profile('bob', ['priv']),
    carol: profile('carol'),
  }

  it('counts the whole community for a public channel', () => {
    expect(countChannelMembers({ id: 'general', public: true }, userProfiles)).toEqual(3)
  })

  it('treats a channel with no explicit privacy as public', () => {
    expect(countChannelMembers({ id: 'general' }, userProfiles)).toEqual(3)
  })

  it('counts only the profiles carrying the channel for a private channel', () => {
    expect(countChannelMembers({ id: 'priv', public: false }, userProfiles)).toEqual(2)
  })

  it("counts a DM's participant list", () => {
    expect(
      countChannelMembers({ id: 'dm', type: ChannelType.DM, memberIds: ['alice', 'carol'] }, userProfiles)
    ).toEqual(2)
  })

  it('counts nothing without a channel', () => {
    expect(countChannelMembers(undefined, userProfiles)).toEqual(0)
  })
})

describe('memberCountLabel', () => {
  it('uses the singular for one member', () => {
    expect(memberCountLabel(1)).toEqual('1 member')
  })

  it('uses the plural for none and for many', () => {
    expect(memberCountLabel(0)).toEqual('0 members')
    expect(memberCountLabel(32)).toEqual('32 members')
  })
})

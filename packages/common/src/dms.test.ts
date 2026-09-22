import { ChannelType, PublicChannel } from '@quiet/types'

import crypto from 'crypto'

import { dmMemberHashFor, dmMemberIdsFor, findDmChannelWithMembers, generateDmMemberHash } from './dms'

const channel = (overrides: Partial<PublicChannel>): PublicChannel => ({
  id: 'id',
  name: 'name',
  description: '',
  owner: 'owner',
  timestamp: 0,
  type: ChannelType.DM,
  ...overrides,
})

// The hash as it is stored on every DM ever created: sha256 of the sorted ids joined by commas.
// Spelled out rather than derived from the helpers, so a change to the canonical form cannot pass
// by changing both sides of the comparison at once.
const storedHash = (joinedIds: string) => crypto.createHash('sha256').update(joinedIds).digest('base64')

describe('dmMemberIdsFor / dmMemberHashFor', () => {
  const me = 'me-id'
  const a = 'alice-id'

  it('makes a self-DM of [me] and of [me, me] alike', () => {
    expect(dmMemberIdsFor([me], me)).toEqual([me])
    expect(dmMemberIdsFor([me, me], me)).toEqual([me])
    expect(dmMemberHashFor([me], me)).toEqual(storedHash('me-id'))
    expect(dmMemberHashFor([me, me], me)).toEqual(storedHash('me-id'))
  })

  it('makes [a, me], [me, a] and [a] the same two-person DM', () => {
    const expected = storedHash('alice-id,me-id')
    expect(dmMemberIdsFor([a, me], me)).toEqual([a, me])
    expect(dmMemberIdsFor([me, a], me)).toEqual([a, me])
    expect(dmMemberHashFor([a, me], me)).toEqual(expected)
    expect(dmMemberHashFor([me, a], me)).toEqual(expected)
    // I am always in my own DMs, whether or not the caller said so.
    expect(dmMemberHashFor([a], me)).toEqual(expected)
    expect(dmMemberHashFor([a, a], me)).toEqual(expected)
  })

  it('keeps the self-DM distinct from a DM with somebody else', () => {
    expect(dmMemberHashFor([me], me)).not.toEqual(dmMemberHashFor([a], me))
  })

  // Every DM already stored carries generateDmMemberHash(memberIds); the helper must agree with it.
  it('agrees with the hash stored on existing channels', () => {
    expect(dmMemberHashFor([a], me)).toEqual(generateDmMemberHash([me, a]))
    expect(dmMemberHashFor([], me)).toEqual(generateDmMemberHash([me]))
  })
})

describe('findDmChannelWithMembers', () => {
  const alice = 'alice'
  const bob = 'bob'
  const carol = 'carol'

  it('finds the DM whose participants are exactly the ones asked for', () => {
    const wanted = channel({ id: 'dm-ab', memberIds: [alice, bob], memberIdHash: generateDmMemberHash([alice, bob]) })
    const other = channel({
      id: 'dm-ac',
      memberIds: [alice, carol],
      memberIdHash: generateDmMemberHash([alice, carol]),
    })

    expect(findDmChannelWithMembers([bob], alice, [other, wanted])?.id).toEqual('dm-ab')
  })

  // The hash sorts and dedupes, so the caller never has to think about order.
  it('does not care what order the members are given in', () => {
    const dm = channel({ id: 'dm-ab', memberIds: [alice, bob], memberIdHash: generateDmMemberHash([bob, alice]) })

    expect(findDmChannelWithMembers([bob], alice, [dm])?.id).toEqual('dm-ab')
  })

  it('does not mistake a group DM for the pair inside it', () => {
    const group = channel({
      id: 'dm-abc',
      memberIds: [alice, bob, carol],
      memberIdHash: generateDmMemberHash([alice, bob, carol]),
    })

    expect(findDmChannelWithMembers([bob], alice, [group])).toBeUndefined()
  })

  it('does not return a public channel that happens to carry members', () => {
    const notADm = channel({ id: 'general', type: ChannelType.CHANNEL, memberIds: [alice, bob] })

    expect(findDmChannelWithMembers([bob], alice, [notADm])).toBeUndefined()
  })

  // Channels replicated before memberIdHash was stored still have to be matchable.
  it('hashes memberIds when the channel carries no stored hash', () => {
    const legacy = channel({ id: 'dm-ab', memberIds: [alice, bob] })

    expect(findDmChannelWithMembers([bob], alice, [legacy])?.id).toEqual('dm-ab')
  })

  it('finds the DM with myself however the selection spells me', () => {
    const selfDm = channel({ id: 'dm-a', memberIds: [alice], memberIdHash: generateDmMemberHash([alice]) })
    const withBob = channel({ id: 'dm-ab', memberIds: [alice, bob], memberIdHash: generateDmMemberHash([alice, bob]) })

    expect(findDmChannelWithMembers([alice], alice, [withBob, selfDm])?.id).toEqual('dm-a')
    expect(findDmChannelWithMembers([alice, alice], alice, [withBob, selfDm])?.id).toEqual('dm-a')
    expect(findDmChannelWithMembers([alice, bob], alice, [selfDm, withBob])?.id).toEqual('dm-ab')
  })

  it('returns nothing when there is no such conversation', () => {
    expect(findDmChannelWithMembers([bob], alice, [])).toBeUndefined()
    expect(findDmChannelWithMembers([], alice, [channel({ memberIds: [alice] })])).toBeUndefined()
  })
})

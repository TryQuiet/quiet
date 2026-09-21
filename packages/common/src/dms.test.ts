import { ChannelType, PublicChannel } from '@quiet/types'

import { findDmChannelWithMembers, generateDmMemberHash } from './dms'

const channel = (overrides: Partial<PublicChannel>): PublicChannel => ({
  id: 'id',
  name: 'name',
  description: '',
  owner: 'owner',
  timestamp: 0,
  type: ChannelType.DM,
  ...overrides,
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

    expect(findDmChannelWithMembers([alice, bob], [other, wanted])?.id).toEqual('dm-ab')
  })

  // The hash sorts and dedupes, so the caller never has to think about order.
  it('does not care what order the members are given in', () => {
    const dm = channel({ id: 'dm-ab', memberIds: [alice, bob], memberIdHash: generateDmMemberHash([bob, alice]) })

    expect(findDmChannelWithMembers([alice, bob], [dm])?.id).toEqual('dm-ab')
  })

  it('does not mistake a group DM for the pair inside it', () => {
    const group = channel({
      id: 'dm-abc',
      memberIds: [alice, bob, carol],
      memberIdHash: generateDmMemberHash([alice, bob, carol]),
    })

    expect(findDmChannelWithMembers([alice, bob], [group])).toBeUndefined()
  })

  it('does not return a public channel that happens to carry members', () => {
    const notADm = channel({ id: 'general', type: ChannelType.CHANNEL, memberIds: [alice, bob] })

    expect(findDmChannelWithMembers([alice, bob], [notADm])).toBeUndefined()
  })

  // Channels replicated before memberIdHash was stored still have to be matchable.
  it('hashes memberIds when the channel carries no stored hash', () => {
    const legacy = channel({ id: 'dm-ab', memberIds: [alice, bob] })

    expect(findDmChannelWithMembers([alice, bob], [legacy])?.id).toEqual('dm-ab')
  })

  it('returns nothing when there is no such conversation', () => {
    expect(findDmChannelWithMembers([alice, bob], [])).toBeUndefined()
    expect(findDmChannelWithMembers([], [channel({ memberIds: [alice] })])).toBeUndefined()
  })
})

import {
  generateChannelId,
  getChannelNameFromChannelId,
  isBoundChannelId,
  parseBoundChannelId,
  verifyChannelIdOwner,
} from './channelAddress'

const ownerId = 'owner-user-id'

describe('Generate Channel Id', () => {
  it('name "rockets" is the channel name', () => {
    expect(generateChannelId('rockets', ownerId)).toContain('rockets')
  })

  it('binds the owner into the id and verifies', () => {
    const channelId = generateChannelId('rockets', ownerId)
    expect(isBoundChannelId(channelId)).toBe(true)
    expect(verifyChannelIdOwner(channelId, ownerId)).toBe(true)
  })

  it('does not verify against a different owner', () => {
    const channelId = generateChannelId('rockets', ownerId)
    expect(verifyChannelIdOwner(channelId, 'someone-else')).toBe(false)
  })

  it('produces the expected `${name}_${nonce}_${commitment}` structure', () => {
    const channelId = generateChannelId('rockets', ownerId)
    const parsed = parseBoundChannelId(channelId)
    expect(parsed).not.toBeNull()
    expect(parsed!.name).toEqual('rockets')
    expect(parsed!.nonce).toMatch(/^[0-9a-f]{32}$/)
    expect(parsed!.commitment).toMatch(/^[0-9a-f]{64}$/)
  })

  it('supports channel names containing underscores', () => {
    const channelId = generateChannelId('my_cool_channel', ownerId)
    expect(parseBoundChannelId(channelId)!.name).toEqual('my_cool_channel')
    expect(verifyChannelIdOwner(channelId, ownerId)).toBe(true)
  })
})

describe('Bound vs legacy channel ids', () => {
  it('treats legacy `name_<random>` ids as unbound', () => {
    const legacyId = 'rockets_1faff74afc8daff3256275ce89d30528'
    expect(isBoundChannelId(legacyId)).toBe(false)
    expect(verifyChannelIdOwner(legacyId, ownerId)).toBe(false)
    expect(parseBoundChannelId(legacyId)).toBeNull()
  })
})

describe('Get Channel Name From Channel Id', () => {
  it('returns the channel name for a bound id', () => {
    const channelId = generateChannelId('rockets', ownerId)
    expect(getChannelNameFromChannelId(channelId)).toEqual('rockets')
  })
  it('returns the channel name for a legacy id', () => {
    const channelId = 'rockets_1faff74afc8daff3256275ce89d30528'
    expect(getChannelNameFromChannelId(channelId)).toEqual('rockets')
  })
  it('Should return the channel id if does not match the structure', () => {
    const channelName = 'rockets'
    const invalidChannelId = 'rockets+1faff74afc8daff3256275ce89d30528'
    expect(getChannelNameFromChannelId(channelName)).toEqual(channelName)
    expect(getChannelNameFromChannelId(invalidChannelId)).toEqual(invalidChannelId)
  })
})

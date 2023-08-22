import { generateChannelId, getChannelNameFormChannelId } from './channelAddress'

describe('Generate Channel Id', () => {
  it('name "rockets" is the channel name', () => {
    expect(generateChannelId('rockets')).toContain('rockets')
  })

  it('Should include hexadecimals characters in a determined structure (name + _ + 16 hex)', () => {
    const channelName = 'rockets'
    const randomBytesLength = 32 // 16 chars in hex
    const underscoreLength = 1
    const expectedLength = channelName.length + underscoreLength + randomBytesLength
    expect(generateChannelId('rockets')).toHaveLength(expectedLength)
  })
})

describe('Get Channel Name From Channel Id', () => {
  it('Should return the channel name', () => {
    const channelId = 'rockets_1faff74afc8daff3256275ce89d30528'
    const channelName = 'rockets'
    expect(getChannelNameFormChannelId(channelId)).toEqual(channelName)
  })
  it('Should return the channel id fi does not match the structure', () => {
    const channelName = 'rockets'
    const invalidChannelId = 'rockets+1faff74afc8daff3256275ce89d30528'
    expect(getChannelNameFormChannelId(channelName)).toEqual(channelName)
    expect(getChannelNameFormChannelId(invalidChannelId)).toEqual(invalidChannelId)
  })
})

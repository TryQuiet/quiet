import { getInvitationCodes } from './invitationCode'
import { Site } from '@quiet/common'

describe('Invitation code helper', () => {
  it('retrieves invitation code if url is a proper share url', () => {
    const result = getInvitationCodes(`https://${Site.DOMAIN}/${Site.JOIN_PAGE}#peerId1=address1&peerId2=address2`)
    expect(result).toEqual([
      { peerId: 'peerId1', address: 'address1' },
      { peerId: 'peerId2', address: 'address2' },
    ])
  })

  it('returns empty list if code is not a proper share url nor a code', () => {
    const result = getInvitationCodes('invalidCode')
    expect(result).toEqual([])
  })

  it('retrieves invitation code if url is a proper code', () => {
    const result = getInvitationCodes(`peerId1=address1&peerId2=address2`)
    expect(result).toEqual([
      { peerId: 'peerId1', address: 'address1' },
      { peerId: 'peerId2', address: 'address2' },
    ])
  })
})

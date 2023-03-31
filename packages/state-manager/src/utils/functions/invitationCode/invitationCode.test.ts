import { getInvitationCode } from './invitationCode'
import { Site } from '@quiet/common'

describe('Invitation code helper', () => {
  it('retrieves invitation code if url is a proper share url', () => {
    const result = getInvitationCode(`https://${Site.DOMAIN}/${Site.JOIN_PAGE}?code=validCode`)
    expect(result).toEqual('validCode')
  })

  it('returns passed value if url is not a proper share url', () => {
    const result = getInvitationCode('validCode')
    expect(result).toEqual('validCode')
  })
})

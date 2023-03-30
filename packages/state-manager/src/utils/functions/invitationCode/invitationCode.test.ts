import { Site } from '../../../constants'
import { getInvitationCode, invitationDeepUrl, invitationShareUrl } from './invitationCode'

describe('Invitation code helper', () => {
  it('builds proper invitation deep url', () => {
    expect(invitationDeepUrl('validCode')).toEqual('quiet://?code=validCode')
  })

  it('builds proper invitation share url', () => {
    expect(invitationShareUrl('validCode')).toEqual(`https://${Site.DOMAIN}/${Site.JOIN_PAGE}?code=validCode`)
  })

  it('retrieves invitation code if url is a proper share url', () => {
    const result = getInvitationCode(`https://${Site.DOMAIN}/${Site.JOIN_PAGE}?code=validCode`)
    expect(result).toEqual('validCode')
  })

  it('returns passed value if url is not a proper share url', () => {
    const result = getInvitationCode('validCode')
    expect(result).toEqual('validCode')
  })
})

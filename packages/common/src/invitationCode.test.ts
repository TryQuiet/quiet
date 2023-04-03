import { argvInvitationCode, invitationDeepUrl, invitationShareUrl } from './invitationCode'
import { Site } from './static'

describe('Invitation code helper', () => {
  it('retrieves invitation code from argv', () => {
    const result = argvInvitationCode([
      'something',
      'quiet:/invalid',
      'zbay://invalid',
      'quiet://invalid',
      'quiet://?param=invalid',
      invitationDeepUrl('validCode')

    ])
    expect(result).toBe('validCode')
  })

  it('builds proper invitation deep url', () => {
    expect(invitationDeepUrl('validCode')).toEqual('quiet://?code=validCode')
  })

  it('builds proper invitation share url', () => {
    expect(invitationShareUrl('validCode')).toEqual(`https://${Site.DOMAIN}/${Site.JOIN_PAGE}?code=validCode`)
  })
})

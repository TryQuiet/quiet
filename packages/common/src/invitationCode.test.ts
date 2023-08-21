import { argvInvitationCode, invitationDeepUrl, invitationShareUrl, pairsToInvitationShareUrl } from './invitationCode'
import { Site } from './static'

describe('Invitation code helper', () => {
  it('retrieves invitation code from argv', () => {
    const expectedCodes = [
      { peerId: 'peerID1', address: 'address1' },
      { peerId: 'peerID2', address: 'address2' },
    ]
    const result = argvInvitationCode([
      'something',
      'quiet:/invalid',
      'zbay://invalid',
      'quiet://invalid',
      'quiet://?param=invalid',
      invitationDeepUrl(expectedCodes),
    ])
    expect(result).toBe(expectedCodes)
  })

  it('builds proper invitation deep url', () => {
    expect(
      invitationDeepUrl([
        { peerId: 'peerID1', address: 'address1' },
        { peerId: 'peerID2', address: 'address2' },
      ])
    ).toEqual('quiet://?peerID1=address1&peerID2=address2')
  })

  it('creates invitation share url based on invitation pairs', () => {
    const pairs = [
      { peerId: 'peerID1', address: 'address1' },
      { peerId: 'peerID2', address: 'address2' },
    ]
    const expected = `https://${Site.DOMAIN}/${Site.JOIN_PAGE}#peerID1=address1&peerID2=address2`
    expect(pairsToInvitationShareUrl(pairs)).toEqual(expected)
  })

  // it('builds proper invitation share url', () => {
  //   expect(invitationShareUrl('validCode')).toEqual(`https://${Site.DOMAIN}/${Site.JOIN_PAGE}#validCode`)
  // })

  it('builds proper invitation share url', () => {
    const peerList = [
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/443/wss/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE',
      'invalidAddress',
      '/dns4/somethingElse.onion/tcp/443/wss/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA',
    ]
    expect(invitationShareUrl(peerList)).toEqual(
      `https://${Site.DOMAIN}/${Site.JOIN_PAGE}#QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE=gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad&QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA=somethingElse`
    )
  })
})

import {
  argvInvitationCode,
  invitationDeepUrl,
  invitationShareUrl,
  pairsToInvitationShareUrl,
  retrieveInvitationCode,
} from './invitationCode'
import { Site } from './static'

describe('Invitation code helper', () => {
  const peerId1 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA'
  const address1 = 'gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad'
  const peerId2 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE'
  const address2 = 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd'

  it('retrieves invitation code from argv', () => {
    const expectedCodes = [
      { peerId: peerId1, address: address1 },
      { peerId: peerId2, address: address2 },
    ]
    const result = argvInvitationCode([
      'something',
      'quiet:/invalid',
      'zbay://invalid',
      'quiet://invalid',
      'quiet://?param=invalid',
      invitationDeepUrl(expectedCodes),
    ])
    expect(result).toEqual(expectedCodes)
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

  it('retrieves invitation codes from deep url', () => {
    const codes = retrieveInvitationCode(`quiet://?${peerId1}=${address1}&${peerId2}=${address2}`)
    expect(codes).toEqual([
      { peerId: peerId1, address: address1 },
      { peerId: peerId2, address: address2 },
    ])
  })

  it('retrieves invitation codes from deep url with partly invalid codes', () => {
    const peerId1 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA'
    const address1 = 'gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad'
    const peerId2 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLs'
    const address2 = 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd'
    const codes = retrieveInvitationCode(`quiet://?${peerId1}=${address1}&${peerId2}=${address2}}`)
    expect(codes).toEqual([{ peerId: peerId1, address: address1 }])
  })
})

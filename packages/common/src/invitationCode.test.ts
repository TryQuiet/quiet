import { InvitationData } from '@quiet/types'
import {
  argvInvitationCode,
  invitationDeepUrl,
  invitationShareUrl,
  pairsToInvitationShareUrl,
  retrieveInvitationCode,
} from './invitationCode'
import { QUIET_JOIN_PAGE, Site } from './static'

describe('Invitation code helper', () => {
  const peerId1 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA'
  const address1 = 'gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad'
  const peerId2 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE'
  const address2 = 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd'

  it('retrieves invitation code from argv', () => {
    const expectedCodes: InvitationData = {
      pairs: [
        { peerId: peerId1, onionAddress: address1 },
        { peerId: peerId2, onionAddress: address2 },
      ],
      psk: '12345',
    }
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
      invitationDeepUrl({
        pairs: [
          { peerId: 'peerID1', onionAddress: 'address1' },
          { peerId: 'peerID2', onionAddress: 'address2' },
        ],
        psk: '12345',
      })
    ).toEqual(`quiet://?peerID1=address1&peerID2=address2&${Site.PSK_PARAM_KEY}=12345`)
  })

  it('creates invitation share url based on invitation data', () => {
    const pairs: InvitationData = {
      pairs: [
        { peerId: 'peerID1', onionAddress: 'address1' },
        { peerId: 'peerID2', onionAddress: 'address2' },
      ],
      psk: '12345',
    }
    const expected = `${QUIET_JOIN_PAGE}#peerID1=address1&peerID2=address2&${Site.PSK_PARAM_KEY}=${pairs.psk}`
    expect(pairsToInvitationShareUrl(pairs)).toEqual(expected)
  })

  it('builds proper invitation share url', () => {
    const peerList = [
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/443/wss/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE',
      'invalidAddress',
      '/dns4/somethingElse.onion/tcp/443/wss/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA',
    ]
    const psk = 'L2tleS9zd2FybS9wc2svMS'
    expect(invitationShareUrl(peerList, psk)).toEqual(
      `${QUIET_JOIN_PAGE}#QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE=gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad&QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA=somethingElse&${Site.PSK_PARAM_KEY}=${psk}`
    )
  })

  it('retrieves invitation codes from deep url', () => {
    const psk = 12345
    const codes = retrieveInvitationCode(
      `quiet://?${peerId1}=${address1}&${peerId2}=${address2}&${Site.PSK_PARAM_KEY}=${psk}`
    )
    expect(codes).toEqual({
      pairs: [
        { peerId: peerId1, onionAddress: address1 },
        { peerId: peerId2, onionAddress: address2 },
      ],
      psk: psk,
    })
  })

  it('retrieves invitation codes from deep url with partly invalid codes', () => {
    const psk = '12345'
    const peerId2 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLs'
    const address2 = 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd'
    const codes = retrieveInvitationCode(
      `quiet://?${peerId1}=${address1}&${peerId2}=${address2}&${Site.PSK_PARAM_KEY}=${psk}`
    )
    expect(codes).toEqual({ pairs: [{ peerId: peerId1, onionAddress: address1 }], psk: psk })
  })
})

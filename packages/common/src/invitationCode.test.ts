import { InvitationData } from '@quiet/types'
import {
  argvInvitationCode,
  composeInvitationDeepUrl,
  invitationShareUrl,
  composeInvitationShareUrl,
  parseInvitationCodeDeepUrl,
} from './invitationCode'
import { QUIET_JOIN_PAGE, Site } from './static'

describe('Invitation code helper', () => {
  const peerId1 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA'
  const address1 = 'gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad'
  const peerId2 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE'
  const address2 = 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd'
  const psk = 'BNlxfE2WBF7LrlpIX0CvECN5o1oZtA16PkAb7GYiwYw%3D'
  const pskDecoded = 'BNlxfE2WBF7LrlpIX0CvECN5o1oZtA16PkAb7GYiwYw='

  it('retrieves invitation code from argv', () => {
    const expectedCodes: InvitationData = {
      pairs: [
        { peerId: peerId1, onionAddress: address1 },
        { peerId: peerId2, onionAddress: address2 },
      ],
      psk: pskDecoded,
    }
    const result = argvInvitationCode([
      'something',
      'quiet:/invalid',
      'zbay://invalid',
      'quiet://invalid',
      'quiet://?param=invalid',
      composeInvitationDeepUrl(expectedCodes),
    ])
    expect(result).toEqual(expectedCodes)
  })

  it('returns null if argv do not contain any valid invitation code', () => {
    const result = argvInvitationCode([
      'something',
      'quiet:/invalid',
      'zbay://invalid',
      'quiet://invalid',
      'quiet://?param=invalid',
    ])
    expect(result).toBeNull()
  })

  it('composes proper invitation deep url', () => {
    expect(
      composeInvitationDeepUrl({
        pairs: [
          { peerId: 'peerID1', onionAddress: 'address1' },
          { peerId: 'peerID2', onionAddress: 'address2' },
        ],
        psk: pskDecoded,
      })
    ).toEqual(`quiet://?peerID1=address1&peerID2=address2&${Site.PSK_PARAM_KEY}=${psk}`)
  })

  it('creates invitation share url based on invitation data', () => {
    const pairs: InvitationData = {
      pairs: [
        { peerId: 'peerID1', onionAddress: 'address1' },
        { peerId: 'peerID2', onionAddress: 'address2' },
      ],
      psk: pskDecoded,
    }
    const expected = `${QUIET_JOIN_PAGE}#peerID1=address1&peerID2=address2&${Site.PSK_PARAM_KEY}=${psk}`
    expect(composeInvitationShareUrl(pairs)).toEqual(expected)
  })

  it('builds proper invitation share url from peers addresses', () => {
    const peerList = [
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/443/wss/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE',
      'invalidAddress',
      '/dns4/somethingElse.onion/tcp/443/wss/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA',
    ]
    expect(invitationShareUrl(peerList, pskDecoded)).toEqual(
      `${QUIET_JOIN_PAGE}#QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE=gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad&QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA=somethingElse&${Site.PSK_PARAM_KEY}=${psk}`
    )
  })

  it('retrieves invitation codes from deep url', () => {
    const codes = parseInvitationCodeDeepUrl(
      `quiet://?${peerId1}=${address1}&${peerId2}=${address2}&${Site.PSK_PARAM_KEY}=${psk}`
    )
    expect(codes).toEqual({
      pairs: [
        { peerId: peerId1, onionAddress: address1 },
        { peerId: peerId2, onionAddress: address2 },
      ],
      psk: pskDecoded,
    })
  })

  it.each([['12345'], ['a2FzemE='], 'a2FycGllIHcgZ2FsYXJlY2llIGVjaWUgcGVjaWUgYWxlIGkgdGFrIHpqZWNpZQ=='])(
    'parsing invitation code throws error if psk is invalid: (%s)',
    (psk: string) => {
      expect(() => {
        parseInvitationCodeDeepUrl(
          `quiet://?${peerId1}=${address1}&${peerId2}=${address2}&${Site.PSK_PARAM_KEY}=${psk}`
        )
      }).toThrow()
    }
  )

  it('retrieves invitation codes from deep url with partly invalid codes', () => {
    const peerId2 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLs'
    const address2 = 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd'
    const parsed = parseInvitationCodeDeepUrl(
      `quiet://?${peerId1}=${address1}&${peerId2}=${address2}&${Site.PSK_PARAM_KEY}=${psk}`
    )
    expect(parsed).toEqual({ pairs: [{ peerId: peerId1, onionAddress: address1 }], psk: pskDecoded })
  })
})

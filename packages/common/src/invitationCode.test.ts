import { InvitationData, InvitationDataVersion, InvitationPair } from '@quiet/types'
import {
  argvInvitationCode,
  composeInvitationDeepUrl,
  composeInvitationShareUrl,
  parseInvitationCodeDeepUrl,
  PSK_PARAM_KEY,
  OWNER_ORBIT_DB_IDENTITY_PARAM_KEY,
  p2pAddressesToPairs,
  CID_PARAM_KEY,
  TOKEN_PARAM_KEY,
  SERVER_ADDRESS_PARAM_KEY,
  INVITER_ADDRESS_PARAM_KEY,
  DEEP_URL_SCHEME_WITH_SEPARATOR,
} from './invitationCode'
import { QUIET_JOIN_PAGE } from './static'
import { validInvitationDatav2 } from './tests'

describe(`Invitation code helper ${InvitationDataVersion.v1}`, () => {
  const peerId1 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA'
  const address1 = 'gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad'
  const peerId2 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE'
  const address2 = 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd'
  const psk = 'BNlxfE2WBF7LrlpIX0CvECN5o1oZtA16PkAb7GYiwYw%3D'
  const pskDecoded = 'BNlxfE2WBF7LrlpIX0CvECN5o1oZtA16PkAb7GYiwYw='
  const ownerOrbitDbIdentity = 'testOwnerOrbitDbIdentity'

  it('retrieves invitation code from argv', () => {
    const expectedCodes: InvitationData = {
      pairs: [
        { peerId: peerId1, onionAddress: address1 },
        { peerId: peerId2, onionAddress: address2 },
      ],
      psk: pskDecoded,
      ownerOrbitDbIdentity,
    }
    const result = argvInvitationCode([
      'something',
      'quiet:/invalid',
      'zbay://invalid',
      composeInvitationDeepUrl(expectedCodes),
    ])
    expect(result).toEqual(expectedCodes)
  })

  it('returns null if argv do not contain any url with proper scheme', () => {
    const result = argvInvitationCode(['something', 'quiet:/invalid', 'zbay://invalid'])
    expect(result).toBeNull()
  })

  it('throws error if argv contains invalid invitation url', () => {
    expect(() => {
      argvInvitationCode(['something', 'quiet:/invalid', 'quiet://?param=invalid'])
    }).toThrow()
  })

  it('composes proper invitation deep url', () => {
    expect(
      composeInvitationDeepUrl({
        pairs: [
          { peerId: 'peerID1', onionAddress: 'address1' },
          { peerId: 'peerID2', onionAddress: 'address2' },
        ],
        psk: pskDecoded,
        ownerOrbitDbIdentity,
      })
    ).toEqual(
      `quiet://?peerID1=address1&peerID2=address2&${PSK_PARAM_KEY}=${psk}&${OWNER_ORBIT_DB_IDENTITY_PARAM_KEY}=${ownerOrbitDbIdentity}`
    )
  })

  it('creates invitation share url based on invitation data', () => {
    const pairs: InvitationData = {
      pairs: [
        { peerId: 'peerID1', onionAddress: 'address1' },
        { peerId: 'peerID2', onionAddress: 'address2' },
      ],
      psk: pskDecoded,
      ownerOrbitDbIdentity,
    }
    const expected = `${QUIET_JOIN_PAGE}#peerID1=address1&peerID2=address2&${PSK_PARAM_KEY}=${psk}&${OWNER_ORBIT_DB_IDENTITY_PARAM_KEY}=${ownerOrbitDbIdentity}`
    expect(composeInvitationShareUrl(pairs)).toEqual(expected)
  })

  it('converts list of p2p addresses to invitation pairs', () => {
    const pair: InvitationPair = {
      peerId: 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE',
      onionAddress: 'gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad',
    }
    const peerList = [
      `/dns4/${pair.onionAddress}.onion/tcp/443/wss/p2p/${pair.peerId}`,
      'invalidAddress',
      '/dns4/somethingElse.onion/tcp/443/wss/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA',
    ]
    console.log('p2pAddressesToPairs(peerList)', p2pAddressesToPairs(peerList))
    expect(p2pAddressesToPairs(peerList)).toEqual([pair])
  })

  it('retrieves invitation codes from deep url', () => {
    const codes = parseInvitationCodeDeepUrl(
      `quiet://?${peerId1}=${address1}&${peerId2}=${address2}&${PSK_PARAM_KEY}=${psk}&${OWNER_ORBIT_DB_IDENTITY_PARAM_KEY}=${ownerOrbitDbIdentity}`
    )
    expect(codes).toEqual({
      version: InvitationDataVersion.v1,
      pairs: [
        { peerId: peerId1, onionAddress: address1 },
        { peerId: peerId2, onionAddress: address2 },
      ],
      psk: pskDecoded,
      ownerOrbitDbIdentity,
    })
  })

  it.each([['12345'], ['a2FzemE='], 'a2FycGllIHcgZ2FsYXJlY2llIGVjaWUgcGVjaWUgYWxlIGkgdGFrIHpqZWNpZQ=='])(
    'parsing invitation code throws error if psk is invalid: (%s)',
    (psk: string) => {
      expect(() => {
        parseInvitationCodeDeepUrl(
          `quiet://?${peerId1}=${address1}&${peerId2}=${address2}&${PSK_PARAM_KEY}=${psk}&${OWNER_ORBIT_DB_IDENTITY_PARAM_KEY}=${ownerOrbitDbIdentity}`
        )
      }).toThrow()
    }
  )

  it('retrieves invitation codes from deep url with partly invalid codes', () => {
    const peerId2 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLs'
    const address2 = 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd'
    const parsed = parseInvitationCodeDeepUrl(
      `${DEEP_URL_SCHEME_WITH_SEPARATOR}?${peerId1}=${address1}&${peerId2}=${address2}&${PSK_PARAM_KEY}=${psk}&${OWNER_ORBIT_DB_IDENTITY_PARAM_KEY}=${ownerOrbitDbIdentity}`
    )
    expect(parsed).toEqual({
      version: InvitationDataVersion.v1,
      pairs: [{ peerId: peerId1, onionAddress: address1 }],
      psk: pskDecoded,
      ownerOrbitDbIdentity,
    })
  })
})

describe(`Invitation code helper ${InvitationDataVersion.v2}`, () => {
  const data = validInvitationDatav2[0]
  const urlParams = [
    [CID_PARAM_KEY, data.cid],
    [TOKEN_PARAM_KEY, data.token],
    [SERVER_ADDRESS_PARAM_KEY, data.serverAddress],
    [INVITER_ADDRESS_PARAM_KEY, data.inviterAddress],
  ]

  it('creates invitation share url based on invitation data', () => {
    const url = new URL(QUIET_JOIN_PAGE)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))
    expect(composeInvitationShareUrl(data)).toEqual(url.href.replace('?', '#'))
  })

  it('composes proper invitation deep url', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))
    expect(composeInvitationDeepUrl(data)).toEqual(url.href)
  })

  it('retrieves invitation codes from deep url v2', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))
    const codes = parseInvitationCodeDeepUrl(url.href)
    expect(codes).toEqual({
      version: InvitationDataVersion.v2,
      cid: data.cid,
      token: data.token,
      serverAddress: data.serverAddress,
      inviterAddress: data.inviterAddress,
    })
  })

  it.each([
    // TODO: add check for invalid token
    [CID_PARAM_KEY, 'sth'],
    [SERVER_ADDRESS_PARAM_KEY, 'website.com'],
    [INVITER_ADDRESS_PARAM_KEY, 'abcd'],
  ])('parsing deep url throws error if data is invalid: %s=%s', (paramKey: string, paramValue: string) => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    // Replace valid param value with invalid one
    url.searchParams.set(paramKey, paramValue)

    expect(() => {
      parseInvitationCodeDeepUrl(url.href)
    }).toThrow()
  })
})

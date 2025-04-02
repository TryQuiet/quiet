import {
  InvitationDataV1,
  InvitationDataV2,
  InvitationDataV3,
  InvitationDataVersion,
  InvitationPair,
} from '@quiet/types'
import {
  argvInvitationLink,
  composeInvitationDeepUrl,
  composeInvitationShareUrl,
  parseInvitationLinkDeepUrl,
  p2pAddressesToPairs,
  peerPairsToUrlParamString,
} from './invitationLink'
import {
  PSK_PARAM_KEY,
  OWNER_ORBIT_DB_IDENTITY_PARAM_KEY,
  DEEP_URL_SCHEME_WITH_SEPARATOR,
  AUTH_DATA_KEY,
  PEER_ADDRESS_KEY,
  QSS_ENABLED_KEY,
  QSS_ENDPOINT_KEY,
} from './invitationLink.const'
import { QUIET_JOIN_PAGE } from '../const'
import { validInvitationDatav1, validInvitationDatav2, validInvitationDatav3 } from '../tests'
import { createLibp2pAddress } from '../libp2p'
import { encodeAuthData, encodeQssEndpoint } from './invitationLink.validator'
import { createLogger } from '../logger'

const logger = createLogger('invite')

describe(`Invitation link helper ${InvitationDataVersion.v1}`, () => {
  const data: InvitationDataV1 = {
    ...validInvitationDatav1[0],
    pairs: [...validInvitationDatav1[0].pairs, ...validInvitationDatav1[1].pairs],
  }
  const urlParams = [
    [PEER_ADDRESS_KEY, peerPairsToUrlParamString([data.pairs[0], data.pairs[1]])],
    [PSK_PARAM_KEY, data.psk],
    [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
  ]

  it('retrieves invitation link from argv', () => {
    const result = argvInvitationLink(['something', 'quiet:/invalid', 'zbay://invalid', composeInvitationDeepUrl(data)])
    expect(result).toEqual(data)
  })

  it('returns null if argv do not contain any url with proper scheme', () => {
    const result = argvInvitationLink(['something', 'quiet:/invalid', 'zbay://invalid'])
    expect(result).toBeNull()
  })

  it('throws error if argv contains invalid invitation url', () => {
    expect(() => {
      argvInvitationLink(['something', 'quiet:/invalid', 'quiet://?param=invalid'])
    }).toThrow()
  })

  it('composes proper invitation deep url', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))
    expect(composeInvitationDeepUrl(data)).toEqual(url.href)
  })

  it('creates invitation share url based on invitation data', () => {
    const url = new URL(QUIET_JOIN_PAGE)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))
    expect(composeInvitationShareUrl(data)).toEqual(url.href.replace('?', '#'))
  })

  it('converts list of p2p addresses to invitation pairs', () => {
    const pair: InvitationPair = data.pairs[0]
    const peerList = [
      createLibp2pAddress(pair.onionAddress, pair.peerId),
      'invalidAddress',
      createLibp2pAddress('somethingElse.onion', 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA'),
    ]
    expect(p2pAddressesToPairs(peerList)).toEqual([pair])
  })

  it('retrieves invitation data from deep url', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    const parsed = parseInvitationLinkDeepUrl(url.href)
    expect(parsed).toEqual({
      version: InvitationDataVersion.v1,
      ...data,
    })
  })

  it.each([
    [PSK_PARAM_KEY, '12345'],
    [PSK_PARAM_KEY, 'a2FzemE='],
    [PSK_PARAM_KEY, 'a2FycGllIHcgZ2FsYXJlY2llIGVjaWUgcGVjaWUgYWxlIGkgdGFrIHpqZWNpZQ=='],
  ])('parsing deep url throws error if data is invalid: %s=%s', (paramKey: string, paramValue: string) => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    // Replace valid param value with invalid one
    url.searchParams.set(paramKey, paramValue)

    expect(() => {
      parseInvitationLinkDeepUrl(url.href)
    }).toThrow()
  })

  it('retrieves invitation data from deep url with partly invalid addresses', () => {
    const urlParamsWithInvalidAddress = [
      [data.pairs[0].peerId, data.pairs[0].onionAddress],
      [data.pairs[1].peerId, data.pairs[1].onionAddress],
      ['QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wf', 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdv'],
      [PSK_PARAM_KEY, data.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
    ]

    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParamsWithInvalidAddress.forEach(([key, value]) => url.searchParams.append(key, value))

    const parsed = parseInvitationLinkDeepUrl(url.href)
    expect(parsed).toEqual({
      version: InvitationDataVersion.v1,
      ...data,
    })
  })
})

describe(`Invitation link helper ${InvitationDataVersion.v2}`, () => {
  const data: InvitationDataV2 = {
    ...validInvitationDatav2[0],
    pairs: [...validInvitationDatav2[0].pairs, ...validInvitationDatav2[1].pairs],
  }
  const urlParams = [
    [PEER_ADDRESS_KEY, peerPairsToUrlParamString(data.pairs)],
    [PSK_PARAM_KEY, data.psk],
    [AUTH_DATA_KEY, encodeAuthData(data.authData)],
  ]

  it('retrieves invitation link from argv', () => {
    const result = argvInvitationLink(['something', 'quiet:/invalid', 'zbay://invalid', composeInvitationDeepUrl(data)])
    logger.info('result', result)
    expect(result).toEqual(data)
  })

  it('returns null if argv do not contain any url with proper scheme', () => {
    const result = argvInvitationLink(['something', 'quiet:/invalid', 'zbay://invalid'])
    expect(result).toBeNull()
  })

  it('throws error if argv contains invalid invitation url', () => {
    expect(() => {
      argvInvitationLink(['something', 'quiet:/invalid', 'quiet://?param=invalid'])
    }).toThrow()
  })

  it('composes proper invitation deep url', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))
    expect(composeInvitationDeepUrl(data)).toEqual(url.href)
  })

  it('creates invitation share url based on invitation data', () => {
    const url = new URL(QUIET_JOIN_PAGE)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))
    expect(composeInvitationShareUrl(data)).toEqual(url.href.replace('?', '#'))
  })

  it('converts list of p2p addresses to invitation pairs', () => {
    const pair: InvitationPair = data.pairs[0]
    const peerList = [
      createLibp2pAddress(pair.onionAddress, pair.peerId),
      'invalidAddress',
      createLibp2pAddress('somethingElse.onion', 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA'),
    ]
    expect(p2pAddressesToPairs(peerList)).toEqual([pair])
  })

  it('retrieves invitation data from deep url', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    const parsed = parseInvitationLinkDeepUrl(url.href)
    expect(parsed).toEqual({
      version: InvitationDataVersion.v2,
      ...data,
    })
  })

  it('does not throw error when deprecated params are present', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))
    url.searchParams.append(OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, validInvitationDatav1[0].ownerOrbitDbIdentity)

    const parsed = parseInvitationLinkDeepUrl(url.href)
    expect(parsed).toEqual({
      version: InvitationDataVersion.v2,
      ...data,
    })
  })

  it('throw error if auth data string is invalid', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const urlParams = [
      [PEER_ADDRESS_KEY, peerPairsToUrlParamString([data.pairs[0], data.pairs[1]])],
      [PSK_PARAM_KEY, data.psk],
      [AUTH_DATA_KEY, '()_*'],
    ]
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toBe(`Invalid value '()_*' for key 'a' in invitation link`)
    }
  })

  it('throw error if peer address param is present but no valid addresses are found', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const urlParams = [
      [PEER_ADDRESS_KEY, 'foobar'],
      [PSK_PARAM_KEY, data.psk],
      [AUTH_DATA_KEY, encodeAuthData(data.authData)],
    ]
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toContain(`Invalid value 'foobar' for key 'p' in invitation link`)
    }
  })

  // TODO: TECH DEBT: Get rid of when we go to 3.0
  it('LEGACY - throw error if no peer pairs are found as named param or dynamic params', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const urlParams = [
      [PSK_PARAM_KEY, data.psk],
      [AUTH_DATA_KEY, encodeAuthData(data.authData)],
    ]
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toContain(`No valid peer addresses found in invitation link`)
    }
  })

  it('throw error if community name is invalid', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const urlParams = [
      [PEER_ADDRESS_KEY, peerPairsToUrlParamString([data.pairs[0], data.pairs[1]])],
      [PSK_PARAM_KEY, data.psk],
      [
        AUTH_DATA_KEY,
        encodeAuthData({
          ...data.authData,
          communityName: '()_*',
        }),
      ],
    ]
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toBe(`Invalid value '()_*' for key 'a.c' in invitation link`)
    }
  })

  it('throw error if seed is invalid', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const urlParams = [
      [PEER_ADDRESS_KEY, peerPairsToUrlParamString([data.pairs[0], data.pairs[1]])],
      [PSK_PARAM_KEY, data.psk],
      [
        AUTH_DATA_KEY,
        encodeAuthData({
          ...data.authData,
          seed: 'ABC!@#!@#!@#!#!@',
        }),
      ],
    ]
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toBe(`Invalid value 'ABC!@#!@#!@#!#!@' for key 'a.s' in invitation link`)
    }
  })

  it.each([
    [PSK_PARAM_KEY, '12345'],
    [PSK_PARAM_KEY, 'a2FzemE='],
    [PSK_PARAM_KEY, 'a2FycGllIHcgZ2FsYXJlY2llIGVjaWUgcGVjaWUgYWxlIGkgdGFrIHpqZWNpZQ=='],
  ])('parsing deep url throws error if data is invalid: %s=%s', (paramKey: string, paramValue: string) => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    // Replace valid param value with invalid one
    url.searchParams.set(paramKey, paramValue)

    expect(() => {
      parseInvitationLinkDeepUrl(url.href)
    }).toThrow()
  })

  it('retrieves invitation data from deep url with partly invalid addresses', () => {
    const urlParamsWithInvalidAddress = [
      [
        PEER_ADDRESS_KEY,
        peerPairsToUrlParamString([
          data.pairs[0],
          data.pairs[1],
          {
            peerId: 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wf',
            onionAddress: 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdv',
          },
        ]),
      ],
      [PSK_PARAM_KEY, data.psk],
      [AUTH_DATA_KEY, encodeAuthData(data.authData)],
    ]

    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParamsWithInvalidAddress.forEach(([key, value]) => url.searchParams.append(key, value))

    const parsed = parseInvitationLinkDeepUrl(url.href)
    expect(parsed).toEqual({
      version: InvitationDataVersion.v2,
      ...data,
    })
  })

  // TODO: TECH DEBT: Get rid of when we go to 3.0
  it('LEGACY - retrieves invitation data from url with dynamic peer address params', () => {
    const urlParamsWithDynamicPeerParams = [
      [data.pairs[0].peerId, data.pairs[0].onionAddress],
      [data.pairs[1].peerId, data.pairs[1].onionAddress],
      [PSK_PARAM_KEY, data.psk],
      [AUTH_DATA_KEY, encodeAuthData(data.authData)],
    ]

    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParamsWithDynamicPeerParams.forEach(([key, value]) => url.searchParams.append(key, value))

    const parsed = parseInvitationLinkDeepUrl(url.href)
    expect(parsed).toEqual({
      version: InvitationDataVersion.v2,
      ...data,
    })
  })
})

describe(`Invitation link helper ${InvitationDataVersion.v3}`, () => {
  const address = 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd'
  const peerId = '12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN4zF'
  const data: InvitationDataV3 = {
    ...validInvitationDatav3[0],
    pairs: [...validInvitationDatav1[0].pairs, { peerId: peerId, onionAddress: address }],
  }
  const urlParams = [
    [PEER_ADDRESS_KEY, peerPairsToUrlParamString([data.pairs[0], data.pairs[1]])],
    [PSK_PARAM_KEY, data.psk],
    [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
    [AUTH_DATA_KEY, encodeAuthData(data.authData)],
    [QSS_ENABLED_KEY, `${data.qssEnabled}`],
    [QSS_ENDPOINT_KEY, encodeQssEndpoint(data.qssEndpoint)],
  ]

  it('retrieves invitation link from argv', () => {
    const result = argvInvitationLink(['something', 'quiet:/invalid', 'zbay://invalid', composeInvitationDeepUrl(data)])
    expect(result).toEqual(data)
  })

  it('returns null if argv do not contain any url with proper scheme', () => {
    const result = argvInvitationLink(['something', 'quiet:/invalid', 'zbay://invalid'])
    expect(result).toBeNull()
  })

  it('throws error if argv contains invalid invitation url', () => {
    expect(() => {
      argvInvitationLink(['something', 'quiet:/invalid', 'quiet://?param=invalid'])
    }).toThrow()
  })

  it('composes proper invitation deep url', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))
    expect(composeInvitationDeepUrl(data)).toEqual(url.href)
  })

  it('creates invitation share url based on invitation data when qss is enabled', () => {
    const url = new URL(QUIET_JOIN_PAGE)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))
    expect(composeInvitationShareUrl(data)).toEqual(url.href.replace('?', '#'))
  })

  it('creates invitation share url based on invitation data when qss is disabled', () => {
    const disabledData: InvitationDataV3 = {
      ...validInvitationDatav3[1],
      pairs: [...validInvitationDatav1[0].pairs, { peerId: peerId, onionAddress: address }],
    }
    const disabledParams = [
      [PEER_ADDRESS_KEY, peerPairsToUrlParamString([disabledData.pairs[0], disabledData.pairs[1]])],
      [PSK_PARAM_KEY, disabledData.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, disabledData.ownerOrbitDbIdentity],
      [AUTH_DATA_KEY, encodeAuthData(disabledData.authData)],
      [QSS_ENABLED_KEY, `${disabledData.qssEnabled}`],
      [QSS_ENDPOINT_KEY, encodeQssEndpoint(data.qssEndpoint)],
    ]
    const url = new URL(QUIET_JOIN_PAGE)
    disabledParams.forEach(([key, value]) => url.searchParams.append(key, value))
    expect(composeInvitationShareUrl(disabledData)).toEqual(url.href.replace('?', '#'))
  })

  it('converts list of p2p addresses to invitation pairs', () => {
    const pair: InvitationPair = {
      peerId,
      onionAddress: address,
    }
    const peerList = [
      createLibp2pAddress(pair.onionAddress, pair.peerId),
      'invalidAddress',
      createLibp2pAddress('somethingElse.onion', 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA'),
    ]
    expect(p2pAddressesToPairs(peerList)).toEqual([pair])
  })

  it('retrieves invitation data from deep url', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    const parsed = parseInvitationLinkDeepUrl(url.href)
    expect(parsed).toEqual({
      version: InvitationDataVersion.v3,
      ...data,
    })
  })

  it('throw error if auth data string is invalid', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const urlParams = [
      [PEER_ADDRESS_KEY, peerPairsToUrlParamString([data.pairs[0], data.pairs[1]])],
      [PSK_PARAM_KEY, data.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
      [AUTH_DATA_KEY, '()_*'],
      [QSS_ENABLED_KEY, `${data.qssEnabled}`],
      [QSS_ENDPOINT_KEY, encodeQssEndpoint(data.qssEndpoint)],
    ]
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toBe(`Invalid value '()_*' for key 'a' in invitation link`)
    }
  })

  it('throw error if qssEnabled is missing', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const invalidUrlParams = [
      [PEER_ADDRESS_KEY, peerPairsToUrlParamString([data.pairs[0], data.pairs[1]])],
      [PSK_PARAM_KEY, data.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
      [AUTH_DATA_KEY, encodeAuthData(data.authData)],
      [QSS_ENABLED_KEY, ''],
      [QSS_ENDPOINT_KEY, encodeQssEndpoint(data.qssEndpoint)],
    ]
    invalidUrlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toBe(`Invalid value '' for key 'q' in invitation link`)
    }
  })

  it('throw error if qssEnabled is present but invalid', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const invalidUrlParams = [
      [PEER_ADDRESS_KEY, peerPairsToUrlParamString([data.pairs[0], data.pairs[1]])],
      [PSK_PARAM_KEY, data.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
      [AUTH_DATA_KEY, encodeAuthData(data.authData)],
      [QSS_ENABLED_KEY, 'foo'],
      [QSS_ENDPOINT_KEY, encodeQssEndpoint(data.qssEndpoint)],
    ]
    invalidUrlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toBe(`Invalid value 'foo' for key 'q' in invitation link`)
    }
  })

  it('throws error if qssEndpoint is missing', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const invalidUrlParams = [
      [PEER_ADDRESS_KEY, peerPairsToUrlParamString([data.pairs[0], data.pairs[1]])],
      [PSK_PARAM_KEY, data.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
      [AUTH_DATA_KEY, encodeAuthData(data.authData)],
      [QSS_ENABLED_KEY, `${data.qssEnabled}`],
    ]
    invalidUrlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toBe(`Missing required key 'e' in invitation link`)
    }
  })

  it('throws error if qssEndpoint is invalid', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const invalidUrlParams = [
      [PEER_ADDRESS_KEY, peerPairsToUrlParamString([data.pairs[0], data.pairs[1]])],
      [PSK_PARAM_KEY, data.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
      [AUTH_DATA_KEY, encodeAuthData(data.authData)],
      [QSS_ENABLED_KEY, `${data.qssEnabled}`],
      [QSS_ENDPOINT_KEY, encodeQssEndpoint('foobar')],
    ]
    invalidUrlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toBe(`Invalid value 'foobar' for key 'e' in invitation link - Value was an invalid URL`)
    }
  })

  it('throws error if qssEndpoint is missing port', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const invalidUrlParams = [
      [PEER_ADDRESS_KEY, peerPairsToUrlParamString([data.pairs[0], data.pairs[1]])],
      [PSK_PARAM_KEY, data.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
      [AUTH_DATA_KEY, encodeAuthData(data.authData)],
      [QSS_ENABLED_KEY, `${data.qssEnabled}`],
      [QSS_ENDPOINT_KEY, encodeQssEndpoint('ws://localhost')],
    ]
    invalidUrlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toBe(`Invalid value 'ws://localhost' for key 'e' in invitation link - Port was null`)
    }
  })

  it('throws error if qssEndpoint is not a ws/wss url', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const invalidUrlParams = [
      [PEER_ADDRESS_KEY, peerPairsToUrlParamString([data.pairs[0], data.pairs[1]])],
      [PSK_PARAM_KEY, data.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
      [AUTH_DATA_KEY, encodeAuthData(data.authData)],
      [QSS_ENABLED_KEY, `${data.qssEnabled}`],
      [QSS_ENDPOINT_KEY, encodeQssEndpoint('http://localhost:3000')],
    ]
    invalidUrlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toBe(
        `Invalid value 'http://localhost:3000' for key 'e' in invitation link - Protocol must be 'ws:' or 'wss:'`
      )
    }
  })

  it('throw error if peer address param is present but no valid addresses are found', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const urlParams = [
      [PEER_ADDRESS_KEY, 'foobar'],
      [PSK_PARAM_KEY, data.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
      [AUTH_DATA_KEY, encodeAuthData(data.authData)],
      [QSS_ENABLED_KEY, `${data.qssEnabled}`],
      [QSS_ENDPOINT_KEY, encodeQssEndpoint(data.qssEndpoint)],
    ]
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toContain(`Invalid value 'foobar' for key 'p' in invitation link`)
    }
  })

  // TODO: TECH DEBT: Get rid of when we go to 3.0
  it('LEGACY - throw error if no peer pairs are found as named param or dynamic params', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const urlParams = [
      [PSK_PARAM_KEY, data.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
      [AUTH_DATA_KEY, encodeAuthData(data.authData)],
      [QSS_ENABLED_KEY, `${data.qssEnabled}`],
      [QSS_ENDPOINT_KEY, encodeQssEndpoint(data.qssEndpoint)],
    ]
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toContain(`No valid peer addresses found in invitation link`)
    }
  })

  it('throw error if community name is invalid', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const urlParams = [
      [PEER_ADDRESS_KEY, peerPairsToUrlParamString([data.pairs[0], data.pairs[1]])],
      [PSK_PARAM_KEY, data.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
      [
        AUTH_DATA_KEY,
        encodeAuthData({
          ...data.authData,
          communityName: '()_*',
        }),
      ],
      [QSS_ENABLED_KEY, `${data.qssEnabled}`],
      [QSS_ENDPOINT_KEY, encodeQssEndpoint(data.qssEndpoint)],
    ]
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toBe(`Invalid value '()_*' for key 'a.c' in invitation link`)
    }
  })

  it('throw error if team ID is missing', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const urlParams = [
      [PEER_ADDRESS_KEY, peerPairsToUrlParamString([data.pairs[0], data.pairs[1]])],
      [PSK_PARAM_KEY, data.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
      [
        AUTH_DATA_KEY,
        encodeAuthData({
          ...data.authData,
          teamId: undefined,
        }),
      ],
      [QSS_ENABLED_KEY, `${data.qssEnabled}`],
      [QSS_ENDPOINT_KEY, encodeQssEndpoint(data.qssEndpoint)],
    ]
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toBe(`Missing required key 't' in invitation link`)
    }
  })

  it('throw error if team ID is invalid', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const urlParams = [
      [PEER_ADDRESS_KEY, peerPairsToUrlParamString([data.pairs[0], data.pairs[1]])],
      [PSK_PARAM_KEY, data.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
      [
        AUTH_DATA_KEY,
        encodeAuthData({
          ...data.authData,
          teamId: '()_*',
        }),
      ],
      [QSS_ENABLED_KEY, `${data.qssEnabled}`],
      [QSS_ENDPOINT_KEY, encodeQssEndpoint(data.qssEndpoint)],
    ]
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toBe(`Invalid value '()_*' for key 'a.t' in invitation link`)
    }
  })

  it('throw error if seed is invalid', () => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    const urlParams = [
      [PEER_ADDRESS_KEY, peerPairsToUrlParamString([data.pairs[0], data.pairs[1]])],
      [PSK_PARAM_KEY, data.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
      [
        AUTH_DATA_KEY,
        encodeAuthData({
          ...data.authData,
          seed: 'ABC!@#!@#!@#!#!@',
        }),
      ],
      [QSS_ENABLED_KEY, `${data.qssEnabled}`],
      [QSS_ENDPOINT_KEY, encodeQssEndpoint(data.qssEndpoint)],
    ]
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    try {
      const parsed = parseInvitationLinkDeepUrl(url.href)
      expect(parsed).toBe(null)
    } catch (e) {
      expect(e.message).toBe(`Invalid value 'ABC!@#!@#!@#!#!@' for key 'a.s' in invitation link`)
    }
  })

  it.each([
    [PSK_PARAM_KEY, '12345'],
    [PSK_PARAM_KEY, 'a2FzemE='],
    [PSK_PARAM_KEY, 'a2FycGllIHcgZ2FsYXJlY2llIGVjaWUgcGVjaWUgYWxlIGkgdGFrIHpqZWNpZQ=='],
  ])('parsing deep url throws error if data is invalid: %s=%s', (paramKey: string, paramValue: string) => {
    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))

    // Replace valid param value with invalid one
    url.searchParams.set(paramKey, paramValue)

    expect(() => {
      parseInvitationLinkDeepUrl(url.href)
    }).toThrow()
  })

  it('retrieves invitation data from deep url with partly invalid addresses', () => {
    const urlParamsWithInvalidAddress = [
      [
        PEER_ADDRESS_KEY,
        peerPairsToUrlParamString([
          data.pairs[0],
          data.pairs[1],
          {
            peerId: 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wf',
            onionAddress: 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdv',
          },
        ]),
      ],
      [PSK_PARAM_KEY, data.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
      [AUTH_DATA_KEY, encodeAuthData(data.authData)],
      [QSS_ENABLED_KEY, `${data.qssEnabled}`],
      [QSS_ENDPOINT_KEY, encodeQssEndpoint(data.qssEndpoint)],
    ]

    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParamsWithInvalidAddress.forEach(([key, value]) => url.searchParams.append(key, value))

    const parsed = parseInvitationLinkDeepUrl(url.href)
    expect(parsed).toEqual({
      version: InvitationDataVersion.v3,
      ...data,
    })
  })

  // TODO: TECH DEBT: Get rid of when we go to 3.0
  it('LEGACY - retrieves invitation data from url with dynamic peer address params', () => {
    const urlParamsWithDynamicPeerParams = [
      [data.pairs[0].peerId, data.pairs[0].onionAddress],
      [data.pairs[1].peerId, data.pairs[1].onionAddress],
      [PSK_PARAM_KEY, data.psk],
      [OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity],
      [AUTH_DATA_KEY, encodeAuthData(data.authData)],
      [QSS_ENABLED_KEY, `${data.qssEnabled}`],
      [QSS_ENDPOINT_KEY, encodeQssEndpoint(data.qssEndpoint)],
    ]

    const url = new URL(DEEP_URL_SCHEME_WITH_SEPARATOR)
    urlParamsWithDynamicPeerParams.forEach(([key, value]) => url.searchParams.append(key, value))

    const parsed = parseInvitationLinkDeepUrl(url.href)
    expect(parsed).toEqual({
      version: InvitationDataVersion.v3,
      ...data,
    })
  })
})

import { type InvitationDataV4 } from '@quiet/types'
import { getInvitationLinks } from './invitationCode'
import {
  AUTH_DATA_KEY,
  encodeAuthData,
  PSK_PARAM_KEY,
  QUIET_JOIN_PAGE,
  validInvitationDatav4,
  VERSION_KEY,
} from '@quiet/common'
import { getInvitationCodes } from '../../..'

const getUrlParamsPart = (url: string) => url.split(QUIET_JOIN_PAGE + '?')[1]

describe('Invitation link helper', () => {
  const address = 'gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad'
  const peerId = '12D3KooWKCWstmqi5gaQvipT7xVneVGfWV7HYpCbmUu626R92hXx'
  const data: InvitationDataV4 = {
    ...validInvitationDatav4[0],
    pairs: [...validInvitationDatav4[0].pairs, { peerId: peerId, onionAddress: address }],
  }
  const urlParams = [
    [data.pairs[0].peerId, data.pairs[0].onionAddress],
    [data.pairs[1].peerId, data.pairs[1].onionAddress],
    [PSK_PARAM_KEY, data.psk],
    [AUTH_DATA_KEY, encodeAuthData(data.authData)],
    [VERSION_KEY, data.version],
  ]

  it('retrieves invitation data if url is a proper share url', () => {
    const url = new URL(QUIET_JOIN_PAGE)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))
    const result = getInvitationLinks(url.href.replace('?', '#'))
    expect(result).toEqual({
      ...data,
    })
  })

  it('throws error if link is not a proper share url nor a code', () => {
    expect(() => getInvitationLinks('invalidCode')).toThrow()
  })

  it('throws error if link does not contain psk', () => {
    const url = new URL(QUIET_JOIN_PAGE)
    url.searchParams.append(urlParams[0][0], urlParams[0][1])
    url.searchParams.append(urlParams[1][0], urlParams[1][1])
    expect(() => getInvitationLinks(getUrlParamsPart(url.href))).toThrow()
  })

  it('throws error if psk has invalid format', () => {
    const url = new URL(QUIET_JOIN_PAGE)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))
    url.searchParams.set(PSK_PARAM_KEY, '12345')
    expect(() => getInvitationLinks(getUrlParamsPart(url.href))).toThrow()
  })

  it('retrieves invitation data if url is a proper link', () => {
    const url = new URL(QUIET_JOIN_PAGE)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))
    const result = getInvitationLinks(getUrlParamsPart(url.href))
    expect(result).toEqual({
      ...data,
    })
  })

  it('retrieves invitation code if url is a proper v4 code', () => {
    const url = new URL(QUIET_JOIN_PAGE)
    urlParams.forEach(([key, value]) => url.searchParams.append(key, value))
    const result = getInvitationCodes(getUrlParamsPart(url.href))
    expect(result).toEqual(data)
  })
})

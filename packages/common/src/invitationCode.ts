import { InvitationData, InvitationDataV1, InvitationDataV2, InvitationDataVersion, InvitationPair } from '@quiet/types'
import { QUIET_JOIN_PAGE } from './static'
import { createLibp2pAddress, isPSKcodeValid } from './libp2p'
import Logger from './logger'
const logger = Logger('invite')

// V1 invitation code format (current)
export const PSK_PARAM_KEY = 'k'
export const OWNER_ORBIT_DB_IDENTITY_PARAM_KEY = 'o'

// V2 invitation code format (new)
export const CID_PARAM_KEY = 'c'
export const TOKEN_PARAM_KEY = 't'
export const INVITER_ADDRESS_PARAM_KEY = 'i'
export const SERVER_ADDRESS_PARAM_KEY = 's'

const DEEP_URL_SCHEME_WITH_SEPARATOR = 'quiet://'
const DEEP_URL_SCHEME = 'quiet'
const ONION_ADDRESS_REGEX = /^[a-z0-9]{56}$/g
const PEER_ID_REGEX = /^[a-zA-Z0-9]{46}$/g

interface ParseDeepUrlParams {
  url: string
  expectedProtocol?: string
}

const parseCodeV2 = (url: string): InvitationDataV2 => {
  const params = new URL(url).searchParams

  const cid = params.get(CID_PARAM_KEY)
  if (!cid) throw new Error(`No cid found in invitation code '${url}'`)
  // TODO: Validate CID format
  params.delete(CID_PARAM_KEY)

  let token = params.get(TOKEN_PARAM_KEY)
  if (!token) throw new Error(`No token found in invitation code '${url}'`)
  token = decodeURIComponent(token)
  // TODO: validate token format
  params.delete(TOKEN_PARAM_KEY)

  let serverAddress = params.get(SERVER_ADDRESS_PARAM_KEY)
  if (!serverAddress) throw new Error(`No server address found in invitation code '${url}'`)
  serverAddress = decodeURIComponent(serverAddress)
  try {
    new URL(url)
  } catch (e) {
    throw new Error(`Invalid server address format '${url}'`)
  }
  params.delete(SERVER_ADDRESS_PARAM_KEY)

  let inviterAddress = params.get(INVITER_ADDRESS_PARAM_KEY) // TODO: can it be also peerId-onionAddress pair?
  if (!inviterAddress) throw new Error(`No inviter address in invitation code '${url}'`)
  inviterAddress = decodeURIComponent(inviterAddress)
  if (!inviterAddress.trim().match(ONION_ADDRESS_REGEX)) {
    throw new Error(`No inviter address in invitation code '${url}'`)
  }
  params.delete(INVITER_ADDRESS_PARAM_KEY)

  return {
    version: InvitationDataVersion.v2,
    cid,
    token,
    serverAddress,
    inviterAddress,
  }
}

const parseCodeV1 = (url: string): InvitationDataV1 => {
  const params = new URL(url).searchParams

  let psk = params.get(PSK_PARAM_KEY)
  const codes: InvitationPair[] = []
  if (!psk) throw new Error(`No psk found in invitation code '${url}'`)
  psk = decodeURIComponent(psk)
  if (!isPSKcodeValid(psk)) throw new Error(`Invalid psk in invitation code '${url}'`)
  params.delete(PSK_PARAM_KEY)

  let ownerOrbitDbIdentity = params.get(OWNER_ORBIT_DB_IDENTITY_PARAM_KEY)
  if (!ownerOrbitDbIdentity) throw new Error(`No owner OrbitDB identity found in invitation code '${url}'`)
  ownerOrbitDbIdentity = decodeURIComponent(ownerOrbitDbIdentity)
  params.delete(OWNER_ORBIT_DB_IDENTITY_PARAM_KEY)

  params.forEach((onionAddress, peerId) => {
    if (!peerDataValid({ peerId, onionAddress })) return
    codes.push({
      peerId,
      onionAddress,
    })
  })
  return {
    version: InvitationDataVersion.v1,
    pairs: codes,
    psk,
    ownerOrbitDbIdentity,
  }
}

const parseDeepUrl = ({ url, expectedProtocol = `${DEEP_URL_SCHEME}:` }: ParseDeepUrlParams): InvitationData => {
  let _url = url
  let validUrl: URL | null = null

  if (!expectedProtocol) {
    // Create a full url to be able to use the same URL parsing mechanism
    expectedProtocol = `${DEEP_URL_SCHEME}:`
    _url = `${DEEP_URL_SCHEME_WITH_SEPARATOR}?${url}`
  }

  try {
    validUrl = new URL(_url)
  } catch (e) {
    logger.error(`Could not retrieve invitation code from deep url '${url}'. Reason: ${e.message}`)
    throw e
  }
  if (!validUrl || validUrl.protocol !== expectedProtocol) {
    logger.error(`Could not retrieve invitation code from deep url '${url}'`)
    throw new Error(`Invalid url`)
  }

  const params = validUrl.searchParams

  const psk = params.get(PSK_PARAM_KEY)
  const cid = params.get(CID_PARAM_KEY)
  if (!psk && !cid) throw new Error(`Invitation code does not match either v1 or v2 format '${url}'`)

  let data: InvitationData
  if (psk) {
    data = parseCodeV1(_url)
  } else {
    data = parseCodeV2(_url)
  }

  if (!data) throw new Error(`Could not parse invitation code from deep url '${url}'`)

  logger(`Invitation data '${data}' parsed`)
  return data
}

/**
 * Extract invitation data from deep url.
 * Valid format: quiet://?<peerid1>=<address1>&<peerid2>=<addresss2>&k=<psk>
 */
export const parseInvitationCodeDeepUrl = (url: string): InvitationData => {
  return parseDeepUrl({ url })
}

/**
 * @param code <peerId1>=<address1>&<peerId2>=<address2>&k=<psk>
 */
export const parseInvitationCode = (code: string): InvitationData => {
  return parseDeepUrl({ url: code, expectedProtocol: '' })
}

export const p2pAddressesToPairs = (addresses: string[]): InvitationPair[] => {
  /**
   * @arg {string[]} addresses - List of peer's p2p addresses
   */
  const pairs: InvitationPair[] = []
  for (const peerAddress of addresses) {
    let peerId: string
    let onionAddress: string
    try {
      peerId = peerAddress.split('/p2p/')[1]
    } catch (e) {
      console.info(`Could not add peer address '${peerAddress}' to invitation url. Reason: ${e.message}`)
      continue
    }
    try {
      onionAddress = peerAddress.split('/tcp/')[0].split('/dns4/')[1]
    } catch (e) {
      console.info(`Could not add peer address '${peerAddress}' to invitation url. Reason: ${e.message}`)
      continue
    }

    if (!peerId || !onionAddress) {
      console.error(`No peerId or address in ${peerAddress}`)
      continue
    }
    const rawAddress = onionAddress.endsWith('.onion') ? onionAddress.split('.')[0] : onionAddress
    pairs.push({ peerId: peerId, onionAddress: rawAddress })
  }
  return pairs
}

export const pairsToP2pAddresses = (pairs: InvitationPair[]): string[] => {
  const addresses: string[] = []
  for (const pair of pairs) {
    addresses.push(createLibp2pAddress(pair.onionAddress, pair.peerId))
  }
  return addresses
}

export const composeInvitationShareUrl = (data: InvitationData) => {
  /**
   * @returns {string} - Complete shareable invitation link, e.g.
   * https://tryquiet.org/join/#<peerid1>=<address1>&<peerid2>=<addresss2>&k=<psk>&o=<ownerOrbitDbIdentity>
   */
  return composeInvitationUrl(`${QUIET_JOIN_PAGE}`, data).replace('?', '#')
}

export const composeInvitationDeepUrl = (data: InvitationData): string => {
  return composeInvitationUrl(`${DEEP_URL_SCHEME_WITH_SEPARATOR}`, data)
}

const composeInvitationUrl = (baseUrl: string, data: InvitationData): string => {
  const url = new URL(baseUrl)

  if (!data.version || data.version === InvitationDataVersion.v1) {
    if (!data.pairs || !data.psk || !data.ownerOrbitDbIdentity) return '' // TODO: temporary until better solution is found
    for (const pair of data.pairs) {
      url.searchParams.append(pair.peerId, pair.onionAddress)
    }
    url.searchParams.append(PSK_PARAM_KEY, data.psk)
    url.searchParams.append(OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity)
  } else if (data.version === InvitationDataVersion.v2) {
    if (!data.cid || !data.token || !data.serverAddress || !data.inviterAddress) return '' // TODO: temporary until better solution is found
    url.searchParams.append(CID_PARAM_KEY, data.cid)
    url.searchParams.append(TOKEN_PARAM_KEY, data.token)
    url.searchParams.append(SERVER_ADDRESS_PARAM_KEY, data.serverAddress)
    url.searchParams.append(INVITER_ADDRESS_PARAM_KEY, data.inviterAddress)
  }
  return url.href
}

/**
 * Extract invitation codes from deep url if url is present in argv
 */
export const argvInvitationCode = (argv: string[]): InvitationData | null => {
  let invitationData: InvitationData | null = null
  for (const arg of argv) {
    if (!arg.startsWith(DEEP_URL_SCHEME_WITH_SEPARATOR)) {
      console.log('Not a deep url, not parsing', arg)
      continue
    }
    console.log('Parsing deep url', arg)
    invitationData = parseInvitationCodeDeepUrl(arg)
    if (invitationData.pairs && invitationData.pairs.length > 0) {
      break
    } else {
      invitationData = null
    }
  }
  return invitationData
}

const peerDataValid = ({ peerId, onionAddress }: { peerId: string; onionAddress: string }): boolean => {
  if (!peerId.match(PEER_ID_REGEX)) {
    // TODO: test it more properly e.g with PeerId.createFromB58String(peerId.trim())
    logger(`PeerId ${peerId} is not valid`)
    return false
  }
  if (!onionAddress.trim().match(ONION_ADDRESS_REGEX)) {
    logger(`Onion address ${onionAddress} is not valid`)
    return false
  }
  return true
}

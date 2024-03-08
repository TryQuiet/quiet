import { InvitationData, InvitationPair } from '@quiet/types'
import { QUIET_JOIN_PAGE } from './static'
import { createLibp2pAddress, isPSKcodeValid } from './libp2p'
import Logger from './logger'
const logger = Logger('invite')

export const PSK_PARAM_KEY = 'k'
export const OWNER_ORBIT_DB_IDENTITY_PARAM_KEY = 'o'
const DEEP_URL_SCHEME_WITH_SEPARATOR = 'quiet://'
const DEEP_URL_SCHEME = 'quiet'
const ONION_ADDRESS_REGEX = /^[a-z0-9]{56}$/g
const PEER_ID_REGEX = /^[a-zA-Z0-9]{46}$/g

interface ParseDeepUrlParams {
  url: string
  expectedProtocol?: string
}

const parseDeepUrl = ({ url, expectedProtocol = `${DEEP_URL_SCHEME}:` }: ParseDeepUrlParams): InvitationData => {
  let _url = url
  let validUrl: URL | null = null

  if (!expectedProtocol) {
    // Create a full url to be able to use the same URL parsing mechanism
    expectedProtocol = `${DEEP_URL_SCHEME}:`
    _url = `${DEEP_URL_SCHEME}://?${url}`
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
  const codes: InvitationPair[] = []

  let psk = params.get(PSK_PARAM_KEY)
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
  logger('Retrieved data:', codes)
  return {
    pairs: codes,
    psk,
    ownerOrbitDbIdentity,
  }
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

/**
 * @arg {string[]} peers - List of peer's p2p addresses
 * @arg psk - Pre shared key in base64
 * @returns {string} - Complete shareable invitation link, e.g.
 * https://tryquiet.org/join/#<peerid1>=<address1>&<peerid2>=<addresss2>&k=<psk>&o=<ownerOrbitDbIdentity>
 */
export const invitationShareUrl = (peers: string[] = [], psk: string, ownerOrbitDbIdentity: string): string => {
  const pairs: InvitationPair[] = []
  for (const peerAddress of peers) {
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

  return composeInvitationShareUrl({ pairs, psk, ownerOrbitDbIdentity })
}

export const pairsToP2pAddresses = (pairs: InvitationPair[]): string[] => {
  const addresses: string[] = []
  for (const pair of pairs) {
    addresses.push(createLibp2pAddress(pair.onionAddress, pair.peerId))
  }
  return addresses
}

export const composeInvitationShareUrl = (data: InvitationData) => {
  return composeInvitationUrl(`${QUIET_JOIN_PAGE}`, data).replace('?', '#')
}

export const composeInvitationDeepUrl = (data: InvitationData): string => {
  return composeInvitationUrl(`${DEEP_URL_SCHEME_WITH_SEPARATOR}`, data)
}

const composeInvitationUrl = (baseUrl: string, data: InvitationData): string => {
  const url = new URL(baseUrl)
  for (const pair of data.pairs) {
    url.searchParams.append(pair.peerId, pair.onionAddress)
  }
  url.searchParams.append(PSK_PARAM_KEY, data.psk)
  url.searchParams.append(OWNER_ORBIT_DB_IDENTITY_PARAM_KEY, data.ownerOrbitDbIdentity)
  return url.href
}

/**
 * Extract invitation codes from deep url if url is present in argv
 */
export const argvInvitationCode = (argv: string[]): InvitationData | null => {
  let invitationData: InvitationData | null = null
  for (const arg of argv) {
    try {
      invitationData = parseInvitationCodeDeepUrl(arg)
    } catch (e) {
      continue
    }
    if (invitationData.pairs.length > 0) {
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

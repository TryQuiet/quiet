import { InvitationData, InvitationPair } from '@quiet/types'
import { ONION_ADDRESS_REGEX, PEER_ID_REGEX, PSK_LENGTH, QUIET_JOIN_PAGE, Site } from './static'
import { createLibp2pAddress, isPSKcodeValid } from './libp2p'
import validator from 'validator'

const parseDeepUrl = ({ url, expectedProtocol = `quiet:` }: { url: string; expectedProtocol?: string }) => {
  let _url = url
  let validUrl: URL | null = null

  if (!expectedProtocol) {
    // Create a full url to be able to use the same URL parsing mechanism
    expectedProtocol = `${Site.DEEP_URL_SCHEME}:`
    _url = `${Site.DEEP_URL_SCHEME}://?${url}`
  }

  try {
    validUrl = new URL(_url)
  } catch (e) {
    console.error(`Could not retrieve invitation code from deep url '${url}'. Reason: ${e.message}`)
    throw e
  }
  if (!validUrl || validUrl.protocol !== expectedProtocol) {
    console.error(`Could not retrieve invitation code from deep url '${url}'`)
    throw new Error()
  }
  const params = validUrl.searchParams
  const codes: InvitationPair[] = []
  let psk = params.get(Site.PSK_PARAM_KEY)
  if (!psk) throw new Error(`No psk found in invitation code '${url}'`)

  psk = decodeURIComponent(psk)
  if (!isPSKcodeValid(psk)) throw new Error(`Invalid psk in invitation code '${url}'`)

  params.delete(Site.PSK_PARAM_KEY)

  params.forEach((onionAddress, peerId) => {
    if (!peerDataValid({ peerId, onionAddress })) return
    codes.push({
      peerId,
      onionAddress,
    })
  })
  console.log('Retrieved data:', codes, psk)
  return {
    pairs: codes,
    psk: psk,
  }
}

export const parseInvitationCodeDeepUrl = (url: string): InvitationData => {
  /**
   * Extract invitation data from deep url.
   * Valid format: quiet://?<peerid1>=<address1>&<peerid2>=<addresss2>&k=<psk>
   */
  return parseDeepUrl({ url })
}

export const parseInvitationCode = (code: string): InvitationData => {
  /**
   * @param code <peerId1>=<address1>&<peerId2>=<address2>&k=<psk>
   */
  return parseDeepUrl({ url: code, expectedProtocol: '' })
}

export const invitationShareUrl = (peers: string[] = [], psk: string): string => {
  // TODO: rename
  /**
   * @arg {string[]} peers - List of peer's p2p addresses
   * @returns {string} - Complete shareable invitation link, e.g. https://tryquiet.org/join/#<peerid1>=<address1>&<peerid2>=<addresss2>&k=<psk>
   */
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

  const _url = composeInvitationShareUrl({ pairs: pairs, psk: psk })

  console.log('invitationShareUrl', _url)
  const url = new URL(_url)
  return url.href
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
  return composeInvitationUrl(`${Site.DEEP_URL_SCHEME_WITH_SEPARATOR}`, data)
}

const composeInvitationUrl = (baseUrl: string, data: InvitationData): string => {
  const url = new URL(baseUrl)
  for (const pair of data.pairs) {
    url.searchParams.append(pair.peerId, pair.onionAddress)
  }
  url.searchParams.append(Site.PSK_PARAM_KEY, data.psk)
  return url.href
}

export const argvInvitationCode = (argv: string[]): InvitationData | null => {
  /**
   * Extract invitation codes from deep url if url is present in argv
   */
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
  // TODO: rename to peerDataValid?
  if (!peerId.match(PEER_ID_REGEX)) {
    // TODO: test it more properly e.g with PeerId.createFromB58String(peerId.trim())
    console.log(`PeerId ${peerId} is not valid`)
    return false
  }
  if (!onionAddress.trim().match(ONION_ADDRESS_REGEX)) {
    console.log(`Onion address ${onionAddress} is not valid`)
    return false
  }
  return true
}

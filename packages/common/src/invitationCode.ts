import { InvitationData, InvitationPair } from '@quiet/types'
import { ONION_ADDRESS_REGEX, PEER_ID_REGEX, Site } from './static'
import { createLibp2pAddress } from './libp2p'

export const retrieveInvitationCode = (url: string): InvitationData => {
  // TODO: rename to parseDeepUrl?
  /**
   * Extract invitation data from deep url.
   * Valid format: quiet://?<peerid1>=<address1>&<peerid2>=<addresss2>&k=<psk>
   */
  let data: URL
  try {
    data = new URL(url)
  } catch (e) {
    console.error(`Could not retrieve invitation code from deep url ${url}. Reason: ${e.message}`)
    throw e
  }
  if (!data || data.protocol !== 'quiet:') {
    console.error(`Could not retrieve invitation code from deep url ${url}`)
    throw new Error()
  }
  const params = data.searchParams
  const codes: InvitationPair[] = []
  let psk = params.get(Site.PSK_PARAM_KEY)
  if (!psk) throw new Error(`No psk found in invitation code ${url}`)

  psk = decodeURIComponent(psk) // TODO: can be dangerous?
  // Validate base64

  params.delete(Site.PSK_PARAM_KEY)

  params.forEach((peerId, onionAddress) => {
    if (!invitationCodeValid(peerId, onionAddress)) return
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

export const invitationShareUrl = (peers: string[] = [], psk: string): string => {
  // TODO: rename to 'composeInvitationShareUrl'
  /**
   * @arg {string[]} peers - List of peer's p2p addresses
   * @returns {string} - Complete shareable invitation link, e.g. https://tryquiet.org/join/#<peerid1>=<address1>&<peerid2>=<addresss2>&k=<psk>
   */
  console.log('Invitation share url, peers:', peers)
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

  const _url = pairsToInvitationShareUrl({ pairs: pairs, psk: psk })

  // const _url = `${Site.MAIN_PAGE}${Site.JOIN_PAGE}#${pairs.join('&')}&${psk}`
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

export const pairsToInvitationShareUrl = (data: InvitationData) => {
  const url = new URL(`${Site.MAIN_PAGE}${Site.JOIN_PAGE}`)
  for (const pair of data.pairs) {
    url.searchParams.append(pair.peerId, pair.onionAddress)
  }
  url.searchParams.append(Site.PSK_PARAM_KEY, data.psk)
  return url.href.replace('?', '#')
}

export const invitationDeepUrl = (data: InvitationData): string => {
  // TODO: rename to 'composeInvitationDeepUrl'
  // TODO: refactor - unify with pairsToInvitationShareUrl
  const url = new URL('quiet://')
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
      invitationData = retrieveInvitationCode(arg)
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

export const invitationCodeValid = (peerId: string, onionAddress: string): boolean => {
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

export const getInvitationPairs = (code: string): InvitationData => {
  /**
   * @param code <peerId1>=<address1>&<peerId2>=<address2>&k=<psk>
   */

  // TODO: refactor - use parametrized retrieveInvitationCode instead
  const elements = code.split('&')
  if (elements.length <= 1) throw new Error(`Invitation link '${code}' has not enough data`)
  const pairs = elements.slice(0, -1)

  // TODO: Verify psk format
  const _psk = elements.slice(-1)[0]
  const psk = decodeURIComponent(_psk.split('=')[1]) // FIXME

  const codes: InvitationPair[] = []
  for (const pair of pairs) {
    const [peerId, address] = pair.split('=')
    if (!peerId || !address) continue
    if (!invitationCodeValid(peerId, address)) continue
    codes.push({
      peerId: peerId,
      onionAddress: address,
    })
  }

  console.log('getInvitationPairs', {
    pairs: codes,
    psk: psk,
  })
  return {
    pairs: codes,
    psk: psk,
  }
}

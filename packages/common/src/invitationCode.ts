import { InvitationPair } from '@quiet/types'
import { ONION_ADDRESS_REGEX, Site } from './static'
import { createLibp2pAddress } from './libp2p'
export const retrieveInvitationCode = (url: string): InvitationPair[] => {
  /**
   * Extract invitation codes from deep url.
   * Valid format: quiet://?<peerid1>=<address1>&<peerid2>=<addresss2>
   */
  let data: URL
  try {
    data = new URL(url)
  } catch (e) {
    return []
  }
  if (!data || data.protocol !== 'quiet:') return []
  const params = data.searchParams
  const codes: InvitationPair[] = []
  for (const [peerId, address] of params.entries()) {
    if (!invitationCodeValid(peerId, address)) continue
    codes.push({
      peerId,
      address,
    })
  }
  console.log('Retrieved codes:', codes)
  return codes
}

export const invitationShareUrl = (peers: string[] = []): string => {
  /**
   * @arg {string[]} peers - List of peer's p2p addresses
   * @returns {string} - Complete shareable invitation link, e.g. https://tryquiet.org/join/#<peerid1>=<address1>&<peerid2>=<addresss2>
   */
  const pairs = []
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
    pairs.push(`${peerId}=${rawAddress}`)
  }

  console.log('invitationShareUrl', pairs.join('&'))
  const url = new URL(`${Site.MAIN_PAGE}${Site.JOIN_PAGE}#${pairs.join('&')}`)
  return url.href
}

export const pairsToP2pAddresses = (pairs: InvitationPair[]): string[] => {
  const addresses: string[] = []
  for (const pair of pairs) {
    addresses.push(createLibp2pAddress(pair.address, pair.peerId))
  }
  return addresses
}

export const pairsToInvitationShareUrl = (pairs: InvitationPair[]) => {
  const url = new URL(`${Site.MAIN_PAGE}${Site.JOIN_PAGE}`)
  for (const pair of pairs) {
    url.searchParams.append(pair.peerId, pair.address)
  }
  return url.href.replace('?', '#')
}

export const invitationDeepUrl = (pairs: InvitationPair[] = []): string => {
  const url = new URL('quiet://')
  for (const pair of pairs) {
    url.searchParams.append(pair.peerId, pair.address)
  }
  return url.href
}

export const argvInvitationCode = (argv: string[]): InvitationPair[] => {
  /**
   * Extract invitation codes from deep url if url is present in argv
   */
  let invitationCodes: InvitationPair[] = []
  for (const arg of argv) {
    invitationCodes = retrieveInvitationCode(arg)
    if (invitationCodes.length > 0) {
      break
    }
  }
  return invitationCodes
}

export const invitationCodeValid = (peerId: string, onionAddress: string): boolean => {
  if (!peerId.match(/^[a-zA-Z0-9]{46}$/g)) {
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

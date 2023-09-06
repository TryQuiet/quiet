import { InvitationPair } from '@quiet/types'
import { ONION_ADDRESS_REGEX, Site } from './static'
import { createLibp2pAddress } from './libp2p'
import PeerId from 'peer-id'
// import { multiaddr } from
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
  // Valid format:
  // const mulriaddr = (await import('@multiformats/multiaddr')).default
  const pairs = []
  for (const peerAddress of peers) {
    let addr
    try {
      // addr = mulriaddr.multiaddr(peerAddress)
    } catch (e) {
      console.error(`Could not add peer address '${peerAddress}' to invitation url. Reason: ${e.message}`)
      continue
    }

    const peerId = addr.getPeerId()
    const address: string = addr.nodeAddress().address
    if (!peerId || !address) {
      console.error(`No peerId or address in ${peerAddress}`)
      continue
    }
    const rawAddress = address.endsWith('.onion') ? address.split('.')[0] : address
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
  try {
    PeerId.createFromB58String(peerId.trim())
  } catch (e) {
    console.log(`PeerId ${peerId} is not valid. ${e.message}`)
    return false
  }
  if (!onionAddress.trim().match(ONION_ADDRESS_REGEX)) {
    console.log(`Onion address ${onionAddress} is not valid`)
    return false
  }
  return true
}

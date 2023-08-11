import { InvitationPair } from '@quiet/types'
import { InvitationParams, Site } from './static'
import { multiaddr } from 'multiaddr'

// export const retrieveInvitationCode = (url: string): string => {
//   /**
//    * Extract invitation code from deep url.
//    * Valid format: quiet://?code=<invitation code>
//    */
//   let data: URL
//   try {
//     data = new URL(url)
//   } catch (e) {
//     return ''
//   }
//   if (!data || data.protocol !== 'quiet:') return ''
//   const code = data.searchParams.get(InvitationParams.CODE)
//   if (code) {
//     console.log('Retrieved code:', code)
//     return code
//   }
//   return ''
// }

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
    // TODO: basic check if peerid and address have proper format?
    if (peerId.length !== 46 || address.length !== 56) {
      console.log(`peerId '${peerId}' or address ${address} is not valid`)
      continue
    }
    codes.push({
      peerId,
      address,
    })
  }
  console.log('Retrieved codes:', codes)
  return codes
}

export const invitationShareUrl = (peers: string[] = []): string => {
  // Valid format: https://tryquiet.org/join/#<peerid1>=<address1>&<peerid2>=<addresss2>
  const pairs = []
  for (const peerAddress of peers) {
    let addr
    try {
      addr = multiaddr(peerAddress)
    } catch (e) {
      console.error(`Could not add peer address '${peerAddress}' to invitation url. Reason: ${e.message}`)
      continue
    }

    const peerId = addr.getPeerId()
    const address: string = addr.nodeAddress().address
    if (!peerId || !address) {
      console.error('NO PEER ID OR ADDRESS IN', peerAddress)
      continue
    }
    const rawAddress = address.endsWith('.onion') ? address.split('.')[0] : address
    pairs.push(`${peerId}=${rawAddress}`)
  }

  console.log('CODE', pairs.join('&'))
  const url = new URL(`https://${Site.DOMAIN}/${Site.JOIN_PAGE}#${pairs.join('&')}`)
  return url.href
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

// export const argvInvitationCode = (argv: string[]): string => {
//   /**
//    * Extract invitation code from deep url if url is present in argv
//    */
//   let invitationCode = ''
//   for (const arg of argv) {
//     invitationCode = retrieveInvitationCode(arg)
//     if (invitationCode) {
//       break
//     }
//   }
//   return invitationCode
// }

// export const invitationDeepUrl = (code = ''): string => {
//   const url = new URL('quiet://')
//   url.searchParams.append(InvitationParams.CODE, code)
//   return url.href
// }

// export const invitationShareUrl = (code = ''): string => {
//   const url = new URL(`https://${Site.DOMAIN}/${Site.JOIN_PAGE}#${code}`)
//   return url.href
// }

//import * as mafmt from '@multiformats/mafmt'
import type { Multiaddr } from '@multiformats/multiaddr'
import {
  CODE_CIRCUIT,
  CODE_P2P,
  CODE_TCP,
  CODE_WS,
  CODE_WSS
} from './constants.js'

export function all (multiaddrs: Multiaddr[]) {
  return multiaddrs.filter((ma) => {
    if (ma.protoCodes().includes(CODE_CIRCUIT)) {
      return false
    }

    return

    // const testMa = ma.decapsulateCode(CODE_P2P)

    // return mafmt.WebSockets.matches(testMa) ||
    //   mafmt.WebSocketsSecure.matches(testMa)
  })
}

// export function dnsWss (multiaddrs: Multiaddr[]) {
//   return multiaddrs.filter((ma) => {
//     if (ma.protoCodes().includes(CODE_CIRCUIT)) {
//       return false
//     }

//     const testMa = ma.decapsulateCode(CODE_P2P)

//     return mafmt.WebSocketsSecure.matches(testMa) &&
//       mafmt.DNS.matches(testMa.decapsulateCode(CODE_TCP).decapsulateCode(CODE_WSS))
//   })
// }

// export function dnsWsOrWss (multiaddrs: Multiaddr[]) {
//   return multiaddrs.filter((ma) => {
//     if (ma.protoCodes().includes(CODE_CIRCUIT)) {
//       return false
//     }

//     const testMa = ma.decapsulateCode(CODE_P2P)

//     // WS
//     if (mafmt.WebSockets.matches(testMa)) {
//       return mafmt.DNS.matches(testMa.decapsulateCode(CODE_TCP).decapsulateCode(CODE_WS))
//     }

//     // WSS
//     return mafmt.WebSocketsSecure.matches(testMa) &&
//       mafmt.DNS.matches(testMa.decapsulateCode(CODE_TCP).decapsulateCode(CODE_WSS))
//   })
// }

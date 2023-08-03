import { Site } from '@quiet/common'
import { InvitationPair } from '@quiet/types'

const getInvitationPairs = (code: string) => {
  const pairs = code.split('&')
  const codes: InvitationPair[] = []
  for (const pair of pairs) {
    const [peerId, address] = pair.split('=')
    if (!peerId || !address) continue
    codes.push({
      peerId: peerId,
      address: address,
    })
  }
  return codes
}

export const getInvitationCodes = (codeOrUrl: string): InvitationPair[] => {
  /**
   * Extract codes from invitation share url or return passed value for further validation
   */
  let codes: InvitationPair[] = []
  let potentialCode
  let validUrl: URL | null = null

  try {
    validUrl = new URL(codeOrUrl)
  } catch (e) {
    // It may be just code, not URL
    potentialCode = codeOrUrl
  }

  if (validUrl && validUrl.host === Site.DOMAIN && validUrl.pathname.includes(Site.JOIN_PAGE)) {
    const hash = validUrl.hash
    // const params = validUrl.searchParams
    // TODO: I don't think handling params is needed here as we only accept url with '#' and code without url

    // if (params) {
    //   // Type 'URLSearchParams' must have a '[Symbol.iterator]()' method that returns an iterator
    //   for (const [peerId, address] of params) {
    //     // TODO: basic check if peerid and address have proper format?
    //     if (peerId.length !== 46 || address.length !== 56) {
    //       console.log(`peerId '${peerId}' or address ${address} is not valid`)
    //       continue
    //     }
    //     codes.push({
    //       peerId,
    //       address,
    //     })
    //   }
    // }

    if (hash) {
      // Parse hash
      const pairs = hash.substring(1)
      codes = getInvitationPairs(pairs)
    }
  } else if (potentialCode) {
    // Parse code just as hash value
    codes = getInvitationPairs(potentialCode)
  }

  if (codes.length === 0) {
    console.warn(`No invitation codes. Code/url passed: ${codeOrUrl}`)
  }

  return codes
}

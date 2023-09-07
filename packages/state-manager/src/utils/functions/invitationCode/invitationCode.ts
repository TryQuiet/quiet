import { Site, getInvitationPairs, invitationCodeValid } from '@quiet/common'
import { InvitationPair } from '@quiet/types'

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

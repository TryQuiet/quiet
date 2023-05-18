import { Site } from '@quiet/common'

export const getInvitationCode = (codeOrUrl: string): string => {
  /**
   * Extract code from invitation share url or return passed value for further validation
   */
  let code: string
  let validUrl: URL

  try {
    validUrl = new URL(codeOrUrl)
  } catch (e) {
    code = codeOrUrl
  }
  if (validUrl && validUrl.host === Site.DOMAIN && validUrl.pathname.includes(Site.JOIN_PAGE)) {
    const hash = validUrl.hash

    let invitationCode = hash.substring(1)

    // Ensure backward compatibility
    if (hash.includes('code=')) {
      // Mix of old and new link
      invitationCode = hash.substring(6)
    } else if (validUrl.searchParams.has('code')) {
      // Old link
      invitationCode = validUrl.searchParams.get('code')
    }

    code = invitationCode
  }

  return code
}

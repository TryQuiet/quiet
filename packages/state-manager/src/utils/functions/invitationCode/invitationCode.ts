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

  if (validUrl && validUrl.host === Site.DOMAIN && validUrl.pathname === `/${Site.JOIN_PAGE}`) {
    const hash = window.location.hash

    let invitationCode = hash.substring(1)

    // Ensure backward compatibility
    if (hash.includes('code=')) {
      invitationCode = hash.substring(6)
    }

    code = invitationCode
  }

  return code
}

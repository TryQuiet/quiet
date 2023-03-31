import { Site, InvitationParams } from '@quiet/common'

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
    if (validUrl.searchParams.has(InvitationParams.CODE)) {
      code = validUrl.searchParams.get(InvitationParams.CODE)
    }
  }
  return code
}

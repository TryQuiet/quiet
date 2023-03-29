import { Site, InvitationParams } from "./static"

export const getBytesSize = value => {
  return new TextEncoder().encode(value).length
}

export const getInvitationCode = (value: string): string => {
  let code: string
  let validUrl: URL
  try {
    validUrl = new URL(value)
  } catch (e) {
    code = value
  }

  if (validUrl && validUrl.host === Site.DOMAIN && validUrl.pathname === `/${Site.JOIN_PAGE}`) {
    if (validUrl.searchParams.has(InvitationParams.CODE)) {
      code = validUrl.searchParams.get(InvitationParams.CODE)
    }
  }
  return code
}
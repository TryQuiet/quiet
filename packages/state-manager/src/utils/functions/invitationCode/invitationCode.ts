import { InvitationParams, Site } from '../../../constants'

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

export const invitationDeepUrl = (code: string = ''): string => {
  const url = new URL('quiet://')
  url.searchParams.append(InvitationParams.CODE, code)
  return url.href
}

export const invitationShareUrl = (code: string = ''): string => {
  const url = new URL(`https://${Site.DOMAIN}/${Site.JOIN_PAGE}`)
  url.searchParams.append(InvitationParams.CODE, code)
  return url.href
}

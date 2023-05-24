import { InvitationParams, Site } from './static'

export const retrieveInvitationCode = (url: string): string => {
  /**
   * Extract invitation code from deep url.
   * Valid format: quiet://?code=<invitation code>
  */
  let data: URL
  try {
    data = new URL(url)
  } catch (e) {
    return ''
  }
  if (!data || data.protocol !== 'quiet:') return ''
  if (data.searchParams.has(InvitationParams.CODE)) {
    console.log('Retrieved code:', data.searchParams.get(InvitationParams.CODE))
    return data.searchParams.get(InvitationParams.CODE)
  }
  return ''
}

export const argvInvitationCode = (argv: string[]): string => {
  /**
   * Extract invitation code from deep url if url is present in argv
   */
  let invitationCode: string = ''
  for (const arg of argv) {
    invitationCode = retrieveInvitationCode(arg)
    if (invitationCode) {
      break
    }
  }
  return invitationCode
}

export const invitationDeepUrl = (code: string = ''): string => {
  const url = new URL('quiet://')
  url.searchParams.append(InvitationParams.CODE, code)
  return url.href
}

export const invitationShareUrl = (code: string = ''): string => {
  const url = new URL(`https://${Site.DOMAIN}/${Site.JOIN_PAGE}#${code}`)
  return url.href
}

import { InvitationParams, Site } from './static'

type PotentialString = string | undefined | null

export const retrieveInvitationCode = (url: string): PotentialString => {
  /**
   * Extract invitation code from deep url.
   * Valid format: quiet://?code=<invitation code>
  */
  let data: URL
  try {
    data = new URL(url)
  } catch (e) {
    return
  }
  if (!data || data.protocol !== 'quiet:') return null
  if (data.searchParams.has(InvitationParams.CODE)) {
    console.log('Retrieved code:', data.searchParams.get(InvitationParams.CODE))
    return data.searchParams.get(InvitationParams.CODE)
  }
}

export const argvInvitationCode = (argv: string[]): PotentialString => {
  /**
   * Extract invitation code from deep url if url is present in argv
   */
  let invitationCode: PotentialString
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
  const url = new URL(`https://${Site.DOMAIN}/${Site.JOIN_PAGE}`)
  url.searchParams.append(InvitationParams.CODE, code)
  return url.href
}

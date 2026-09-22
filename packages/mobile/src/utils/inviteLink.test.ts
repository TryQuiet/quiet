import { composeInvitationShareUrl, validInvitationDatav4 } from '@quiet/common'
import { InvitationKind, type DeviceInvitationDataV4, type InvitationDataV4 } from '@quiet/types'

import { parseScannedCode } from '../components/QrScanner/parseScannedCode'
import {
  EMPTY_INVITATION_ERROR,
  INVALID_INVITATION_ERROR,
  NOT_A_DEVICE_LINK_ERROR,
  parseInviteLink,
  validateInviteLink,
} from './inviteLink'

const memberData: InvitationDataV4 = { ...validInvitationDatav4[0], kind: InvitationKind.Member }
const memberLink = composeInvitationShareUrl(validInvitationDatav4[0])

const deviceData: DeviceInvitationDataV4 = {
  ...validInvitationDatav4[0],
  kind: InvitationKind.Device,
  authData: { ...validInvitationDatav4[0].authData, userId: 'device-owner-id', userName: 'device-owner' },
}
const deviceLink = composeInvitationShareUrl(deviceData)

/**
 * The join field's validation used to live inside the pre-redesign Join community screen.
 * That screen is gone and this function is where the rule went, so these are the cases that
 * screen was written against, run against the rule directly.
 */
describe('validateInviteLink', () => {
  it('accepts a member link and hands back the parsed invitation', () => {
    expect(validateInviteLink(memberLink)).toEqual({ data: memberData })
  })

  it('accepts a device link when any invitation is allowed', () => {
    expect(validateInviteLink(deviceLink)).toEqual({ data: deviceData })
  })

  it('trims what it is given, the way the old screen did', () => {
    expect(validateInviteLink(`  ${memberLink}  `)).toEqual({ data: memberData })
  })

  it.each([
    ['nothing typed at all', undefined],
    ['an empty field', ''],
  ])('reports %s as an empty field, before trying to parse it', (_case: string, value: string | undefined) => {
    expect(validateInviteLink(value)).toEqual({ error: EMPTY_INVITATION_ERROR })
  })

  it.each([
    ['a link over plain http', 'http://tryquiet.org/join#nope'],
    ['an onion address on its own', 'nqnw4kc4c77fb47lk52m5l57h4tc'],
    ['the right hash on somebody else’s site', 'https://otherwebsite.com/join#nqnw4kc4c77fb47lk52m5l57h4tc'],
    ['an ordinary web page', 'https://example.com/'],
    ['ordinary prose', 'not a link'],
  ])('reports %s as an invalid invitation', (_case: string, value: string) => {
    expect(validateInviteLink(value)).toEqual({ error: INVALID_INVITATION_ERROR })
  })

  it('never throws on text the parser rejects outright', () => {
    expect(() => validateInviteLink('https://example.com/')).not.toThrow()
  })

  describe('the Link devices variants', () => {
    it.each(['deviceLink', 'pasteDeviceLink'] as const)('accepts a device link on %s', variant => {
      expect(validateInviteLink(deviceLink, variant)).toEqual({ data: deviceData })
    })

    it.each(['deviceLink', 'pasteDeviceLink'] as const)(
      'rejects a member link on %s, which parses but is not what that flow can use',
      variant => {
        expect(validateInviteLink(memberLink, variant)).toEqual({ error: NOT_A_DEVICE_LINK_ERROR })
      }
    )

    it('lets a member link through on the invite-link variant', () => {
      expect(validateInviteLink(memberLink, 'inviteLink')).toEqual({ data: memberData })
    })
  })
})

describe('parseInviteLink', () => {
  it('is the same rule with nothing to report on', () => {
    expect(parseInviteLink(memberLink)).toEqual(memberData)
    expect(parseInviteLink(deviceLink)).toEqual(deviceData)
    expect(parseInviteLink('not a link')).toBeNull()
  })

  /**
   * Not a coincidence to be re-established: the scanner sheet shows INVALID_INVITATION_ERROR
   * for what it cannot read, so it has to be deciding that with the field's own rule and not
   * a second copy of it.
   */
  it('is what the QR scanner runs a decoded code through', () => {
    expect(parseScannedCode).toBe(parseInviteLink)
  })
})

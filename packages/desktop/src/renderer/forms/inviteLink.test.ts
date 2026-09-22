import {
  PSK_PARAM_KEY,
  QUIET_JOIN_PAGE,
  Site,
  getValidInvitationUrlTestData,
  validInvitationDatav4,
} from '@quiet/common'
import { InvitationKind, type DeviceInvitationDataV4, type InvitationDataV4 } from '@quiet/types'

import { InviteLinkErrors } from './fieldsErrors'
import { parseInviteLink, validateInviteLink } from './inviteLink'
import { parseScannedCode } from '../components/Onboarding/qrScanner/decodeQr'

const memberData: InvitationDataV4 = { ...validInvitationDatav4[0], kind: InvitationKind.Member }
const memberCode = getValidInvitationUrlTestData(validInvitationDatav4[0]).code()
const memberLink = getValidInvitationUrlTestData(validInvitationDatav4[0]).shareUrl()

const deviceData: DeviceInvitationDataV4 = {
  ...validInvitationDatav4[0],
  kind: InvitationKind.Device,
  authData: { ...validInvitationDatav4[0].authData, userId: 'device-owner-id', userName: 'device-owner' },
}
const deviceLink = getValidInvitationUrlTestData(deviceData).shareUrl()

/**
 * The join field's validation used to live inside the pre-redesign Join community form.
 * That screen is gone and this function is where the rule went, so these are the cases
 * that form was written against, run against the rule directly.
 */
describe('validateInviteLink', () => {
  it('accepts a member link and hands back the parsed invitation', () => {
    expect(validateInviteLink(memberLink)).toEqual({ data: memberData })
  })

  it('accepts a bare code as well as a full link', () => {
    expect(validateInviteLink(memberCode)).toEqual({ data: memberData })
  })

  it('trims what it is given, the way the old form did', () => {
    expect(validateInviteLink(`   ${memberLink}   `)).toEqual({ data: memberData })
  })

  it('accepts a device link when any invitation is allowed', () => {
    expect(validateInviteLink(deviceLink)).toEqual({ data: deviceData })
  })

  it.each([
    ['an empty field', ''],
    ['a link over plain http', `http://${memberCode}`],
    [
      'a peer id with a psk but no invitation',
      `12D3KooWKCWstmqi5gaQvipT7xVneVGfWV7HYpCbmUu626R92hXx=bbb&${PSK_PARAM_KEY}=x`,
    ],
    ['an unknown key', 'bbb=y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd'],
    ['a trailing-space peer id', '12D3KooWKCWstmqi5gaQvipT7xVneVGfWV7HYpCbmUu626R92hXx= '],
    ['an onion address on its own', 'nqnw4kc4c77fb47lk52m5l57h4tc'],
    ['the right hash on somebody else’s site', `https://otherwebsite.com/${Site.JOIN_PAGE}#${memberCode}`],
    [
      'a query string instead of a hash',
      `${QUIET_JOIN_PAGE}?param=nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad`,
    ],
    ['the share page instead of the join page', `${Site.MAIN_PAGE}/share?${memberCode}`],
    ['ordinary prose', 'not a link'],
  ])('reports %s as an invalid code', (_case: string, value: string) => {
    expect(validateInviteLink(value)).toEqual({ error: InviteLinkErrors.InvalidCode })
  })

  it('never throws on text the parser rejects outright', () => {
    expect(() => validateInviteLink('https://example.com/')).not.toThrow()
  })

  describe("kind 'device'", () => {
    it('accepts a device link', () => {
      expect(validateInviteLink(deviceLink, 'device')).toEqual({ data: deviceData })
    })

    it('rejects a member link, which parses but is not what that flow can use', () => {
      expect(validateInviteLink(memberLink, 'device')).toEqual({ error: InviteLinkErrors.NotDeviceLink })
    })

    it('still reports unparseable text as an invalid code', () => {
      expect(validateInviteLink('not a link', 'device')).toEqual({ error: InviteLinkErrors.InvalidCode })
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
   * Not a coincidence to be re-established: the scanner shows `InviteLinkErrors.InvalidCode`
   * for what it cannot read, so it has to be deciding that with the field's own rule and not
   * a second copy of it.
   */
  it('is what the QR scanner runs a decoded code through', () => {
    expect(parseScannedCode).toBe(parseInviteLink)
  })
})

import { composeInvitationShareUrl, validInvitationDatav4 } from '@quiet/common'
import { type DeviceInvitationDataV4, InvitationKind } from '@quiet/types'

import { parseScannedCode } from './parseScannedCode'

const memberInvite = validInvitationDatav4[0]
const deviceInvite: DeviceInvitationDataV4 = {
  ...memberInvite,
  kind: InvitationKind.Device,
  authData: { ...memberInvite.authData, userId: 'user-id', userName: 'alice' },
}

describe('parseScannedCode', () => {
  it('parses a member invite link exactly as the paste field does', () => {
    expect(parseScannedCode(composeInvitationShareUrl(memberInvite))).toEqual({
      ...memberInvite,
      kind: InvitationKind.Member,
    })
  })

  it('parses a device link', () => {
    expect(parseScannedCode(composeInvitationShareUrl(deviceInvite))).toEqual(deviceInvite)
  })

  it('ignores whitespace around the code', () => {
    expect(parseScannedCode(`  ${composeInvitationShareUrl(memberInvite)}\n`)).toEqual({
      ...memberInvite,
      kind: InvitationKind.Member,
    })
  })

  it('rejects text that is not a Quiet invitation', () => {
    expect(parseScannedCode('https://example.com/menu')).toBeNull()
    expect(parseScannedCode('hello')).toBeNull()
    expect(parseScannedCode('')).toBeNull()
  })
})

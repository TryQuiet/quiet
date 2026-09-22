import { composeInvitationShareUrl, validInvitationDatav4 } from '@quiet/common'
import { InvitationKind } from '@quiet/types'

import { qrImageData } from '../../../testUtils/qrImage'
import { decodeQrImage, parseScannedCode } from './decodeQr'

const memberData = { ...validInvitationDatav4[0], kind: InvitationKind.Member as const }
const memberLink = composeInvitationShareUrl(memberData)
const deviceData = {
  ...validInvitationDatav4[1],
  kind: InvitationKind.Device as const,
  authData: { ...validInvitationDatav4[1].authData, userId: 'q5ck86uuhihx5w00zhknit60', userName: 'alice' },
}
const deviceLink = composeInvitationShareUrl(deviceData)

describe('decodeQrImage', () => {
  it('reads a member invite link out of a frame', () => {
    expect(decodeQrImage(qrImageData(memberLink))).toBe(memberLink)
  })

  it('reads a device link out of a frame', () => {
    expect(decodeQrImage(qrImageData(deviceLink))).toBe(deviceLink)
  })

  it('finds nothing in a frame without a code', () => {
    const blank = { data: new Uint8ClampedArray(64 * 64 * 4).fill(128), width: 64, height: 64 } as ImageData
    expect(decodeQrImage(blank)).toBeNull()
  })
})

describe('parseScannedCode', () => {
  it('parses a member link exactly as the paste field does', () => {
    expect(parseScannedCode(memberLink)).toEqual(memberData)
  })

  it('parses a device link exactly as the paste field does', () => {
    expect(parseScannedCode(deviceLink)).toEqual(deviceData)
  })

  it('ignores surrounding whitespace', () => {
    expect(parseScannedCode(`  ${memberLink}\n`)).toEqual(memberData)
  })

  it.each([['https://example.com/'], ['WIFI:S:cafe;T:WPA;P:secret;;'], [''], ['not a link']])(
    'rejects a code that is not a Quiet invitation: %s',
    text => {
      expect(parseScannedCode(text)).toBeNull()
    }
  )

  it('round-trips a scanned image into the paste field parser', () => {
    const text = decodeQrImage(qrImageData(memberLink))
    expect(text).not.toBeNull()
    expect(parseScannedCode(text!)).toEqual(memberData)
  })
})

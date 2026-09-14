import { InvitationDataVersion, InvitationKind, type DeviceInvitationData } from '@quiet/types'
import { composeInvitationDeepUrl, parseInvitationLinkDeepUrl } from './invitationLink'
import { AUTH_DATA_KEY, INVITATION_KIND_KEY, SALT_KEY, USER_ID_KEY, USER_NAME_KEY } from './invitationLink.const'

const base: DeviceInvitationData = {
  kind: InvitationKind.Device,
  version: InvitationDataVersion.v4,
  pairs: [
    {
      peerId: '12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN4zF',
      onionAddress: 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd',
    },
  ],
  psk: 'BNlxfE2WBF7LrlpIX0CvECN5o1oZtA16PkAb7GYiwYw=',
  authData: {
    communityName: 'community-name',
    seed: '4kgd5mwq5z4fmfwq',
    teamId: '7JLX5PGtsFtGtqfY2co5U8Lq5hTA3',
    userId: 'user-id',
    userName: 'Alice device owner',
  },
}

describe('device invitation links', () => {
  it.each([InvitationDataVersion.v4, InvitationDataVersion.v5])('round trips %s device data', version => {
    const data =
      version === InvitationDataVersion.v5
        ? { ...base, version, qssEnabled: true, qssEndpoint: 'wss://example.com' }
        : base
    expect(parseInvitationLinkDeepUrl(composeInvitationDeepUrl(data))).toEqual(data)
  })

  it('does not serialize a member discriminator', () => {
    const member = {
      ...base,
      kind: undefined,
      authData: { communityName: base.authData.communityName, seed: base.authData.seed, teamId: base.authData.teamId },
    }
    const parsed = parseInvitationLinkDeepUrl(composeInvitationDeepUrl(member))
    expect(parsed.kind).toBeUndefined()
  })

  it.each([USER_ID_KEY, USER_NAME_KEY])('rejects a device link missing identity field %s', key => {
    const url = new URL(composeInvitationDeepUrl(base))
    const auth = new URLSearchParams(Buffer.from(url.searchParams.get(AUTH_DATA_KEY)!, 'base64url').toString())
    auth.delete(key)
    url.searchParams.set(AUTH_DATA_KEY, Buffer.from(auth.toString()).toString('base64url'))
    expect(() => parseInvitationLinkDeepUrl(url.toString())).toThrow('Missing required key')
  })

  it('rejects device credentials relabeled as a member invitation', () => {
    const url = new URL(composeInvitationDeepUrl(base))
    url.searchParams.delete(INVITATION_KIND_KEY)
    expect(() => parseInvitationLinkDeepUrl(url.toString())).toThrow('Invalid value')
  })

  it('rejects a member role salt on a device invitation', () => {
    const url = new URL(
      composeInvitationDeepUrl({
        ...base,
        version: InvitationDataVersion.v5,
        qssEnabled: true,
        qssEndpoint: 'wss://example.com',
      })
    )
    const auth = new URLSearchParams(Buffer.from(url.searchParams.get(AUTH_DATA_KEY)!, 'base64url').toString())
    auth.set(SALT_KEY, '1234567890123456')
    url.searchParams.set(AUTH_DATA_KEY, Buffer.from(auth.toString()).toString('base64url'))
    expect(() => parseInvitationLinkDeepUrl(url.toString())).toThrow('Invalid value')
  })
})

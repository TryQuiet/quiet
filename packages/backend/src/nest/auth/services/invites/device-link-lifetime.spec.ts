import { jest } from '@jest/globals'
import { invitation, lockbox } from '@localfirst/auth'
import { SigChain } from '../../sigchain'
import { DeviceService } from '../members/device.service'
import { InviteService } from './invite.service'

describe('reusable device-link lifetime contract', () => {
  afterEach(() => jest.restoreAllMocks())

  it('admits two distinct devices using the same unexpired link', () => {
    const chain = SigChain.create()
    const invite = chain.invites.createDeviceInvite()
    for (let index = 0; index < 2; index++) {
      const device = DeviceService.generateDeviceForUser(chain.user.userId)
      chain.invites.admitDeviceFromInvite(InviteService.createDeviceAdmission({ seed: invite.seed, device }))
      expect(chain.team!.hasDevice(device.deviceId)).toBe(true)
    }
    expect(chain.team!.members(chain.user.userId).devices).toHaveLength(3)
  })

  it.each(['expiry', 'revocation'] as const)(
    '%s blocks new admission but cannot erase keys recoverable from a retained readable graph and seed',
    boundary => {
      const chain = SigChain.create()
      const invite = chain.invites.createDeviceInvite(60_000)
      const retainedGraph = structuredClone(chain.team!.graph)
      const invitationLink = retainedGraph.links[retainedGraph.head[0]]
      if (invitationLink.body.type !== 'INVITE_DEVICE') throw new Error('Missing device invitation')
      expect(invitationLink.body.payload.invitation.id).toBe(invite.id)
      const retainedLockbox = invitationLink.body.payload.lockboxes[0]
      const historicalUserKeys = structuredClone(chain.user.keys)
      if (boundary === 'expiry') jest.spyOn(Date, 'now').mockReturnValue(invite.expiresAt + 1)
      else chain.team!.revokeInvitation(invite.id)

      const device = DeviceService.generateDeviceForUser(chain.user.userId)
      const admission = InviteService.createDeviceAdmission({ seed: invite.seed, device })
      expect(() => chain.invites.admitDeviceFromInvite(admission)).toThrow()
      expect(chain.team!.hasDevice(device.deviceId)).toBe(false)

      // Expiry/revocation govern admission. They cannot revoke already-distributed ciphertext.
      // The bundled API exports open; its declaration barrel uses source-relative aliases.
      const openLockbox = Reflect.get(
        lockbox,
        'open'
      ) as typeof import('../../../../../../../3rd-party/auth/packages/auth/dist/lockbox/open').open
      const recoveredKeys = openLockbox(retainedLockbox, invitation.generateStarterKeys(invite.seed))
      expect(recoveredKeys).toEqual(historicalUserKeys)
    }
  )
})

import { Connection, type ConnectionParams, type Team, type UserWithSecrets } from '@localfirst/auth'
import { SigChain } from './sigchain'
import { LFAEvents } from './types'

describe('device invitation against real Local First Auth', () => {
  it('admits first-use device keys as the existing user without another role claim', async () => {
    const owner = SigChain.create({ name: 'existing user' })
    const invite = owner.invites.createDeviceInvite()
    const pending = SigChain.createFromDeviceInvite({
      seed: invite.seed,
      userName: owner.user.userName,
      deviceName: 'Linked phone',
      expectedTeamId: owner.team!.id,
      expectedUserId: owner.user.userId,
    })

    const connections = {} as { owner: Connection; device: Connection }
    const ownerConnection = (connections.owner = new Connection({
      context: owner.context,
      sendMessage: message => queueMicrotask(() => connections.device.deliver(message)),
      persistAdmission: async () => undefined,
    } as ConnectionParams))
    const deviceConnection = (connections.device = new Connection({
      context: pending.context,
      sendMessage: message => queueMicrotask(() => connections.owner.deliver(message)),
      persistAdmission: async () => undefined,
    } as ConnectionParams))

    const joined = new Promise<{
      team: Team
      user: UserWithSecrets
    }>((resolve, reject) => {
      deviceConnection.once(LFAEvents.JOINED, resolve)
      deviceConnection.once(LFAEvents.LOCAL_ERROR, reject)
      deviceConnection.once(LFAEvents.REMOTE_ERROR, reject)
    })
    ownerConnection.start()
    deviceConnection.start()
    const payload = await joined
    ownerConnection.stop(false)
    deviceConnection.stop(false)

    const completed = pending.completeDeviceInvitation(payload.team, payload.user)
    expect(completed.user.userId).toBe(owner.user.userId)
    expect(completed.device.deviceId).toBe(pending.device.deviceId)
    expect(completed.team!.device(completed.device.deviceId).userId).toBe(owner.user.userId)
    expect(completed.roles.amIMemberOfRole('member')).toBe(true)
    expect(completed.team!.members(owner.user.userId).devices).toHaveLength(2)
  })
})

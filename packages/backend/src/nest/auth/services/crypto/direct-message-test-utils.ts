import { randomUUID } from 'crypto'
import { MessageType, type ChannelMessage, type PublicChannel } from '@quiet/types'
import { SigChain } from '../../sigchain'
import { InviteService } from '../invites/invite.service'
/** All participants use real invitation claims, possession proofs and signed team graphs. */
export function dmFixture() {
  const admin = SigChain.create({ name: 'Admin outside the DM' })
  const contexts = ['Bob', 'Carol', 'Eve'].map(name => {
    const { seed } = admin.invites.createUserInvite()
    const invitee = SigChain.createFromInvite({ seed, name }, admin.team!.id)
    admin.invites.admitMemberFromInvite(InviteService.createMemberAdmission({ seed, context: invitee.context }))
    const joined = SigChain.joinForTesting(invitee.localUserContext, admin.save(), admin.team!.teamKeyring())
    admin.team!.merge(joined.team!.graph)
    return joined.localUserContext
  })
  const [bob, carol, eve] = contexts.map(context => SigChain.load(admin.save(), context, admin.team!.teamKeyring()))
  const channel = bob.directMessages.create([carol.user.userId])
  const descriptor = bob.directMessages.descriptor(channel.id)
  carol.directMessages.openDescriptor(descriptor, channel.id)
  return { admin, bob, carol, eve, channel, descriptor }
}

export const dmMessage = (chain: SigChain, channel: PublicChannel): ChannelMessage => ({
  id: `${chain.user.userId}:${randomUUID()}`,
  userId: chain.user.userId,
  channelId: channel.id,
  createdAt: Math.floor(Date.now() / 1000),
  type: MessageType.Basic,
  message: 'Confidential DM, with authentic authorship',
})

'use strict'
// Real protocol-4 invitation/admission graphs, generated off the phone.
const fs = require('node:fs')
const path = require('node:path')
const {randomBytes} = require('node:crypto')
const {performance} = require('node:perf_hooks')
function context(auth, name) {
  const first = auth.createFirstUseDevice({deviceName: name + ' device'})
  const user = auth.createUser(name, auth.deriveUserId(first.deviceId))
  return {user, device: {...first, userId: user.userId}}
}
async function createFixtures(bundle, output, sizes = [1, 2, 10, 25, 50, 100], messageCount = 1000) {
  const auth = await bundle.webpack('../../3rd-party/auth/packages/auth/dist/index.js')
  const owner = context(auth, 'Profile owner')
  const team = auth.createTeam('Offline profiling fixture', owner, undefined, {selfAssignableRoles: ['member']})
  team.addRole('member'); team.addMemberRole(owner.user.userId, 'member')
  const invitation = team.inviteMember({roleNames: ['member']})
  let memberContext
  fs.mkdirSync(output, {recursive: true, mode: 0o700})
  const allMessages = []
  for (let i = 0; i < messageCount; i++) {
    const contents = {id: 'profile-message-' + i, message: 'Profile message ' + i + ' ' + randomBytes(12).toString('hex'), userId: owner.user.userId, type: 1, channelId: 'profile-general', teamId: team.id, createdAt: 1700000000000 + i}
    const encrypted = team.encrypt(contents, 'member')
    const signed = team.sign(contents)
    allMessages.push({contents, encrypted: {...encrypted, contents: Buffer.from(encrypted.contents).toString('base64')}, signed})
  }
  fs.writeFileSync(path.join(output, 'messages.json'), JSON.stringify(allMessages), {mode: 0o600})
  const receipts = []
  const start = performance.now()
  for (let users = 1; users <= Math.max(...sizes); users++) {
    if (users > 1) {
      const invitee = context(auth, 'Profile member ' + users)
      memberContext ??= invitee
      const claim = {invitationKind: 'member', userName: invitee.user.userName, memberKeys: auth.redactKeys(invitee.user.keys), device: auth.redactDevice(invitee.device)}
      const proof = auth.generateProof({seed: invitation.seed, claim, identityNonce: randomBytes(24).toString('hex'), inviteeNonce: randomBytes(24).toString('hex')})
      const possession = auth.invitation.createPossessionProof({invitationId: invitation.id, claim, device: invitee.device})
      team.admitMember(proof, claim, possession)
      const keyring = team.teamKeyring()
      const joining = auth.loadTeam(team.save(), invitee, keyring)
      joining.join(keyring)
      if (!joining.addMemberRoleFromInvitation('member', invitation.seed)) throw new Error('Invitation role grant failed')
      team.merge(joining.graph)
    }
    if (!sizes.includes(users)) continue
    const source = Buffer.from(team.save()).toString('base64')
    const fixture = {users, owner, member: memberContext, source, teamKeyring: team.teamKeyring()}
    fs.writeFileSync(path.join(output, 'team-' + users + '.json'), JSON.stringify(fixture), {mode: 0o600})
    if (team.members().length !== users) throw new Error('Fixture membership count mismatch')
    const receipt = {users, graphLinks: Object.keys(team.graph.links).length, lockboxes: team.state.lockboxes.length, sourceBytes: Buffer.from(source, 'base64').length, elapsedSeconds: (performance.now() - start) / 1000}
    receipts.push(receipt); fs.writeFileSync(path.join(output, 'receipts.json'), JSON.stringify(receipts, null, 2))
    console.log(JSON.stringify(receipt))
  }
  return receipts
}
module.exports = {context, createFixtures}
if (require.main === module) {
  const bundle = require(path.resolve(process.argv[2]))
  createFixtures(bundle, process.argv[3], process.env.PROFILE_SIZES?.split(',').map(Number), Number(process.env.PROFILE_MESSAGES || 1000))
    .then(() => process.exit(0)).catch(error => {console.error(error.message); process.exit(1)})
}

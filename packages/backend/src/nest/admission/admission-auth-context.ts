import type { AdmissionAuthContext, AdmissionAuthContextOptions } from './admission-auth-context.types'
import { AdmissionProtocolGate } from './admission-protocol-gate'

export function createAdmissionAuthContext({
  attemptId,
  request,
  transport,
  chain,
  submit,
  fail,
  scope,
}: AdmissionAuthContextOptions) {
  const gate = new AdmissionProtocolGate(scope)
  scope.own(() => gate.revoke())
  const context: AdmissionAuthContext = {
    attemptId,
    request,
    chain,
    gate,
    fail,
    joined: ({ team, user }) => {
      gate.assertCurrent()
      return submit({
        chain,
        team,
        user,
        teamId: team.id,
        userId: user.userId,
        deviceId: chain.device.deviceId,
        kind: request.kind,
        transport,
      })
    },
  }
  // Retain lifecycle controls with the owner; transports receive only context.
  return { context, gate }
}

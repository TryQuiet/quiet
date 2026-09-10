import {
  DeviceInvitationClaim,
  DeviceWithSecrets,
  FirstUseDeviceWithSecrets,
  InvitationClaim,
  LocalUserContext,
  MemberInvitationClaim,
  ProofOfInvitation,
} from '@localfirst/auth'
import { Base58 } from '@localfirst/crypto'

export type InvitationProofParameters = {
  seed: string
  claim: InvitationClaim
  identityNonce: Base58
  inviteeNonce: Base58
}

export type CreateMemberAdmissionParameters = {
  seed: string
  context: LocalUserContext
  identityNonce?: Base58
  inviteeNonce?: Base58
}

export type CreateDeviceAdmissionParameters = {
  seed: string
  device: DeviceWithSecrets | FirstUseDeviceWithSecrets
  identityNonce?: Base58
  inviteeNonce?: Base58
}

export type MemberAdmission = {
  proof: ProofOfInvitation
  claim: MemberInvitationClaim
  possessionProof: Base58
}

export type DeviceAdmission = {
  proof: ProofOfInvitation
  claim: DeviceInvitationClaim
  possessionProof: Base58
}

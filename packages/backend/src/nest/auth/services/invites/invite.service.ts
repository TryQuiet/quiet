/**
 * Handles invite-related chain operations
 */

import { ChainServiceBase } from '../chainServiceBase'
import { ValidationResult } from '@localfirst/crdx'
import {
  Base58,
  DeviceInvitationClaim,
  InvitationState,
  InvitationClaim,
  InviteResult,
  MemberInvitationClaim,
  ProofOfInvitation,
  UnixTimestamp,
  invitation,
  redactDevice,
  redactFirstUseDevice,
  redactKeys,
} from '@localfirst/auth'
import { SigChain } from '../../sigchain'
import { RoleName } from '../roles/roles'
import { createLogger } from '../../../common/logger'
import { DeviceLinkInvite, PermissionsError, InviteResultWithSalt } from '@quiet/types'
import { randomKey } from '@localfirst/crypto'
import {
  CreateDeviceAdmissionParameters,
  CreateMemberAdmissionParameters,
  DeviceAdmission,
  InvitationProofParameters,
  MemberAdmission,
} from './invite.types'

const logger = createLogger('auth:inviteService')

export const DEFAULT_INVITATION_VALID_FOR_MS = 604_800_000 // 1 week
export const DEFAULT_LONG_LIVED_VALID_FOR_MS = 0 // no limit
export const DEFAULT_DEVICE_INVITATION_VALID_FOR_MS = 1_800_000 // 30 minutes

class InviteService extends ChainServiceBase {
  constructor(sigChain: SigChain) {
    super(sigChain)
  }

  public createUserInvite(
    validForMs: number = DEFAULT_INVITATION_VALID_FOR_MS,
    seed?: string,
    roleNames: string[] = []
  ): InviteResult {
    let expiration: UnixTimestamp = 0 as UnixTimestamp
    if (validForMs > 0) {
      expiration = (Date.now() + validForMs) as UnixTimestamp
    }
    if (!this.sigChain.team) {
      throw new Error('SigChain is not initialized')
    }
    if (!this.sigChain.user || !this.sigChain.team!.memberIsAdmin(this.sigChain.user.userId)) {
      throw new PermissionsError('Only the admin can create invites')
    }
    const invitation: InviteResult = this.sigChain.team!.inviteMember({
      seed,
      expiration,
      roleNames,
    })
    return invitation
  }

  public createLongLivedUserInvite(): InviteResultWithSalt {
    const invite = this.createUserInvite(DEFAULT_LONG_LIVED_VALID_FOR_MS, undefined, [RoleName.MEMBER])
    // Generate a base58 salt with same entropy as the invitation seed
    const salt = invitation.randomSeed()
    return {
      ...invite,
      salt,
    }
  }

  public createDeviceInvite(
    validForMs: number = DEFAULT_DEVICE_INVITATION_VALID_FOR_MS,
    seed?: string
  ): DeviceLinkInvite {
    const expiresAt = (Date.now() + validForMs) as UnixTimestamp
    const invitation: InviteResult = this.sigChain.team!.inviteDevice({
      expiration: expiresAt,
      seed,
    })
    return {
      ...invitation,
      expiresAt,
      userId: this.sigChain.user.userId,
      userName: this.sigChain.user.userName,
    }
  }

  public isValidLongLivedUserInvite(id: Base58): boolean {
    logger.info(`Validating LFA invite with ID ${id}`)
    const invites = this.getAllInvites()
    for (const invite of invites) {
      if (
        invite.id === id && // is correct invite
        !invite.revoked && // is not revoked
        invite.kind === 'member' && // is a user invite
        invite.expiration === 0 && // does not expire
        this.sigChain.team!.hasCurrentInvitationRoleGrant(invite.id, RoleName.MEMBER)
      ) {
        return true
      }
    }

    return false
  }

  public revoke(id: string) {
    if (!this.sigChain.user || !this.sigChain.team!.memberIsAdmin(this.sigChain.user.userId)) {
      throw new PermissionsError('Only the admin can revoke invites')
    }
    this.sigChain.team!.revokeInvitation(id)
  }

  public getById(id: Base58): InvitationState {
    return this.sigChain.team!.getInvitation(id)
  }

  /**
   * Test-only helper for generating a complete invitation proof with explicit
   * claims and handshake nonces. Production admission uses LFA Connection.
   */
  public static generateProof(parameters: InvitationProofParameters): ProofOfInvitation {
    return SigChain.lfa.invitation.generateProof(parameters)
  }

  /**
   * Test-only helper that assembles the member claim, invitation proof, and
   * device possession proof normally produced during an LFA handshake.
   */
  public static createMemberAdmission({
    seed,
    context,
    identityNonce = randomKey() as Base58,
    inviteeNonce = randomKey() as Base58,
  }: CreateMemberAdmissionParameters): MemberAdmission {
    const claim: MemberInvitationClaim = {
      invitationKind: 'member',
      userName: context.user.userName,
      memberKeys: redactKeys(context.user.keys),
      device: redactDevice(context.device),
    }
    const proof = this.generateProof({ seed, claim, identityNonce, inviteeNonce })
    const possessionProof = invitation.createPossessionProof({
      invitationId: proof.id,
      claim,
      device: context.device,
    })
    return { proof, claim, possessionProof }
  }

  /**
   * Test-only helper that assembles the device claim, invitation proof, and
   * possession proof normally produced during an LFA handshake.
   */
  public static createDeviceAdmission({
    seed,
    device,
    identityNonce = randomKey() as Base58,
    inviteeNonce = randomKey() as Base58,
  }: CreateDeviceAdmissionParameters): DeviceAdmission {
    const claim: DeviceInvitationClaim = {
      invitationKind: 'device',
      device: redactFirstUseDevice(device),
    }
    const proof = this.generateProof({ seed, claim, identityNonce, inviteeNonce })
    const possessionProof = invitation.createPossessionProof({ invitationId: proof.id, claim, device })
    return { proof, claim, possessionProof }
  }

  public validateProof(proof: ProofOfInvitation, claim: InvitationClaim, possessionProof: Base58): boolean {
    const validationResult = this.sigChain.team!.validateInvitation(proof, claim, possessionProof) as ValidationResult
    if (!validationResult.isValid) {
      logger.warn(`Proof was invalid or was on an invalid invitation`, validationResult.error)
      return false
    }
    return true
  }

  public admitUser({ proof, claim, possessionProof }: MemberAdmission) {
    this.sigChain.team!.admitMember(proof, claim, possessionProof)
  }

  public admitMemberFromInvite({ proof, claim, possessionProof }: MemberAdmission): string {
    this.sigChain.team!.admitMember(proof, claim, possessionProof)
    this.sigChain.roles.addMember(claim.memberKeys.name, RoleName.MEMBER)
    return claim.userName
  }

  public admitDeviceFromInvite({ proof, claim, possessionProof }: DeviceAdmission): void {
    this.sigChain.team!.admitDevice(proof, claim, possessionProof)
  }

  public getAllInvites(): InvitationState[] {
    const inviteMap = this.sigChain.team!.invitations()
    const invites: InvitationState[] = []
    for (const invite of Object.entries(inviteMap)) {
      invites.push(invite[1])
    }
    return invites
  }
}

export { InviteService }

/**
 * Handles invite-related chain operations
 */

import { ChainServiceBase } from '../chainServiceBase'
import { ValidationResult } from '@localfirst/crdx'
import {
  Base58,
  DeviceInvitationClaim,
  InvitationClaim,
  InvitationState,
  InviteResult,
  MemberInvitationClaim,
  ProofOfInvitationV2,
  UnixTimestamp,
  invitation,
} from '@localfirst/auth'
import { randomKey } from '@localfirst/crypto'
import { SigChain } from '../../sigchain'
import { RoleName } from '../roles/roles'
import { createLogger } from '../../../common/logger'
import { DeviceLinkInvite, PermissionsError, InviteResultWithSalt } from '@quiet/types'

const logger = createLogger('auth:inviteService')

export const DEFAULT_MAX_USES = 1
export const DEFAULT_INVITATION_VALID_FOR_MS = 604_800_000 // 1 week
export const DEFAULT_LONG_LIVED_MAX_USES = 0 // no limit
export const DEFAULT_LONG_LIVED_VALID_FOR_MS = 0 // no limit
export const DEFAULT_DEVICE_INVITATION_VALID_FOR_MS = 1_800_000 // 30 minutes

class InviteService extends ChainServiceBase {
  constructor(sigChain: SigChain) {
    super(sigChain)
  }

  public createUserInvite(
    validForMs: number = DEFAULT_INVITATION_VALID_FOR_MS,
    maxUses: number = DEFAULT_MAX_USES,
    seed?: string
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
      maxUses,
    })
    return invitation
  }

  public createLongLivedUserInvite(): InviteResultWithSalt {
    const invite = this.createUserInvite(DEFAULT_LONG_LIVED_VALID_FOR_MS, DEFAULT_LONG_LIVED_MAX_USES)
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
        invite.maxUses == 0 && // is an unlimited invite
        invite.expiration == 0 // is an unlimited invite
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

  public static generateProof(
    seed: string,
    claim: InvitationClaim,
    acceptorNonce: Base58,
    inviteeNonce: Base58 = randomKey()
  ): ProofOfInvitationV2 {
    return SigChain.lfa.invitation.generateProof({
      seed,
      claim,
      acceptorNonce,
      inviteeNonce,
    })
  }

  public validateProof(proof: ProofOfInvitationV2, claim: InvitationClaim, expectedAcceptorNonce: Base58): boolean {
    const validationResult = this.sigChain.team!.validateInvitation(
      proof,
      claim.invitationKind,
      claim,
      expectedAcceptorNonce
    ) as ValidationResult
    if (!validationResult.isValid) {
      logger.warn(`Proof was invalid or was on an invalid invitation`, validationResult.error)
      return false
    }
    return true
  }

  public admitMemberFromInvite(
    proof: ProofOfInvitationV2,
    claim: MemberInvitationClaim,
    expectedAcceptorNonce: Base58
  ): string {
    this.sigChain.team!.admitMember(proof, claim.userKeys, claim.userName, claim.device, expectedAcceptorNonce)
    this.sigChain.roles.addMember(claim.userKeys.name, RoleName.MEMBER)
    return claim.userName
  }

  public admitDeviceFromInvite(
    proof: ProofOfInvitationV2,
    claim: DeviceInvitationClaim,
    expectedAcceptorNonce: Base58
  ): void {
    this.sigChain.team!.admitDevice(proof, claim.device, claim.userName, expectedAcceptorNonce)
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

export type AdmissionResetStatus = 'idle' | 'pending' | 'failed' | 'complete' | 'finalizing'

export type JoinCommunityError =
  | { type: 'timeout'; invitationType: 'device' | 'community' }
  | { type: 'interrupted'; invitationType: 'device' | 'community' }
  | { type: 'invalid' }
  /**
   * The backend negatively acknowledged the request. Nothing is known about why, so the
   * clients say no more about it than they would about a link they could not read.
   */
  | { type: 'refused' }
  /**
   * This device already belongs to a community, and Quiet is one community at a time.
   * Raised by the clients before an invitation is acted on, and again from the backend's
   * own refusal (`COMMUNITY_ALREADY_INITIALIZED`) when a join gets past that check.
   */
  | { type: 'alreadyMember' }

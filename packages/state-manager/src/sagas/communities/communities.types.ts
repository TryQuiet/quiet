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

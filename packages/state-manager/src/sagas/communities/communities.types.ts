export type AdmissionResetStatus = 'idle' | 'pending' | 'failed' | 'complete'

export type JoinCommunityError =
  | { type: 'timeout'; invitationType: 'device' | 'community' }
  | { type: 'interrupted'; invitationType: 'device' | 'community' }
  | { type: 'invalid' }

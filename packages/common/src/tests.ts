import { InvitationData } from '@quiet/types'
import { composeInvitationDeepUrl, composeInvitationShareUrl } from './invitationCode'
import { QUIET_JOIN_PAGE } from './static'

const validInvitationCodeTestData: InvitationData = {
  pairs: [
    {
      onionAddress: 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd',
      peerId: 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE',
    },
  ],
  psk: 'BNlxfE2WBF7LrlpIX0CvECN5o1oZtA16PkAb7GYiwYw=',
}

export const validInvitationUrlTestData = {
  shareUrl: () => composeInvitationShareUrl(validInvitationCodeTestData),
  deepUrl: () => composeInvitationDeepUrl(validInvitationCodeTestData),
  code: () => composeInvitationShareUrl(validInvitationCodeTestData).split(QUIET_JOIN_PAGE + '#')[1],
  data: validInvitationCodeTestData,
}

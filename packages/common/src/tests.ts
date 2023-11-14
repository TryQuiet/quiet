import { InvitationData } from '@quiet/types'
import { composeInvitationDeepUrl, composeInvitationShareUrl } from './invitationCode'
import { QUIET_JOIN_PAGE } from './static'

export const validInvitationCodeTestData: InvitationData[] = [
  {
    pairs: [
      {
        onionAddress: 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd',
        peerId: 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE',
      },
    ],
    psk: 'BNlxfE2WBF7LrlpIX0CvECN5o1oZtA16PkAb7GYiwYw=',
  },
  {
    pairs: [
      {
        onionAddress: 'pgzlcstu4ljvma7jqyalimcxlvss5bwlbba3c3iszgtwxee4qjdlgeqd',
        peerId: 'QmaRchXhkPWq8iLiMZwFfd2Yi4iESWhAYYJt8cTCVXSwpG',
      },
    ],
    psk: '5T9GBVpDoRpKJQK4caDTz5e5nym2zprtoySL2oLrzr4=',
  }
]

export const validInvitationUrlTestData = [
  {
    shareUrl: () => composeInvitationShareUrl(validInvitationCodeTestData[0]),
    deepUrl: () => composeInvitationDeepUrl(validInvitationCodeTestData[0]),
    code: () => composeInvitationShareUrl(validInvitationCodeTestData[0]).split(QUIET_JOIN_PAGE + '#')[1],
    data: validInvitationCodeTestData[0],
  },
  {
    shareUrl: () => composeInvitationShareUrl(validInvitationCodeTestData[1]),
    deepUrl: () => composeInvitationDeepUrl(validInvitationCodeTestData[1]),
    code: () => composeInvitationShareUrl(validInvitationCodeTestData[1]).split(QUIET_JOIN_PAGE + '#')[1],
    data: validInvitationCodeTestData[1],
  }
]

import { type PayloadAction } from '@reduxjs/toolkit'
import {
  CertFieldsTypes,
  getCertFieldValue,
  loadCertificate,
  parseCertificate,
  keyFromCertificate,
} from '@quiet/identity'
import { put, select, call } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { type publicChannelsActions } from '../publicChannels.slice'
import { usersSelectors } from '../../users/users.selectors'
import { identitySelectors } from '../../identity/identity.selectors'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { publicChannelsSelectors } from '../publicChannels.selectors'

import { MessageType, type WriteMessagePayload } from '@quiet/types'
import { type Certificate } from 'pkijs'

export function* sendNewUserInfoMessageSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.sendNewUserInfoMessage>['payload']>
): Generator {
  const community = yield* select(communitiesSelectors.currentCommunity)
  const identity = yield* select(identitySelectors.currentIdentity)

  if (!community?.name || !identity) return

  const isOwner = community.CA
  if (!isOwner) return

  const incomingCertificates = action.payload.certificates

  const knownCertificates = yield* select(usersSelectors.certificates)
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)

  if (!generalChannel) return

  const newCertificates = incomingCertificates.filter(cert => {
    const _cert = keyFromCertificate(parseCertificate(cert))
    return !knownCertificates[_cert]
  })

  // Remove possible duplicates
  const uniqueCertificates = [...new Set(newCertificates)]

  for (const cert of uniqueCertificates) {
    const rootCa: Certificate = yield* call(loadCertificate, cert)
    const user = yield* call(getCertFieldValue, rootCa, CertFieldsTypes.nickName)

    // Do not send message about yourself
    if (identity.nickname === user) return

    const communityName = community.name[0].toUpperCase() + community.name.substring(1)

    const payload: WriteMessagePayload = {
      type: MessageType.Info,
      message: `@${user} has joined ${communityName}! 🎉`,
      channelId: generalChannel.id,
    }

    yield* put(messagesActions.sendMessage(payload))
  }
}

import { PayloadAction } from '@reduxjs/toolkit'
import {
  CertFieldsTypes,
  getCertFieldValue,
  loadCertificate,
  parseCertificate,
  keyFromCertificate
} from '@quiet/identity'
import { put, select, call } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { MessageType, WriteMessagePayload } from '../../messages/messages.types'
import { publicChannelsActions } from '../publicChannels.slice'
import { usersSelectors } from '../../users/users.selectors'
import { identitySelectors } from '../../identity/identity.selectors'
import { communitiesSelectors } from '../../communities/communities.selectors'

import { MAIN_CHANNEL } from '../../../constants'

export function* sendNewUserInfoMessageSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.sendNewUserInfoMessage>['payload']>
): Generator {
  const community = yield* select(communitiesSelectors.currentCommunity)
  const isOwner = community.CA
  const identity = yield* select(identitySelectors.currentIdentity)

  if (!isOwner) return

  const certs = yield* select(usersSelectors.certificates)

  const newCerts = action.payload.certificates.filter(cert => {
    const _cert = keyFromCertificate(parseCertificate(cert))
    return !certs[_cert]
  })

  for (const cert of newCerts) {
    const rootCa = loadCertificate(cert)
    const user = yield* call(getCertFieldValue, rootCa, CertFieldsTypes.nickName)
    if (identity.nickname === user) return
    const communityName = community.name[0].toUpperCase() + community.name.substring(1)
    const payload: WriteMessagePayload = {
      type: MessageType.Info,
      message: `@${user} has joined ${communityName}! 🎉`,
      channelAddress: MAIN_CHANNEL
    }
    yield* put(messagesActions.sendMessage(payload))
  }
}

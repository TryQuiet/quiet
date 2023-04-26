import { PayloadAction } from '@reduxjs/toolkit'
import { call, apply } from 'typed-redux-saga'
import { Time } from 'pkijs'
import { generateId } from '../../../utils/cryptography/cryptography'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { communitiesActions, Community } from '../communities.slice'
import { CommunityOwnership } from '../communities.types'
import { createRootCA } from '@quiet/identity'

export function* createNetworkSaga(
  socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.createNetwork>['payload']>
) {
  let CA: null | {
    rootCertString: string
    rootKeyString: string
  } = null

  if (action.payload.ownership === CommunityOwnership.Owner) {
    const notBeforeDate = new Date(Date.UTC(2010, 11, 28, 10, 10, 10))
    const notAfterDate = new Date(Date.UTC(2030, 11, 28, 10, 10, 10))

    CA = yield* call(
      createRootCA,
      new Time({ type: 0, value: notBeforeDate }),
      new Time({ type: 0, value: notAfterDate }),
      action.payload.name
    )
  }

  const id = yield* call(generateId)

  const registrarUrl = action.payload.registrar ? `http://${action.payload.registrar}.onion` : null

  const payload: Community = {
    id: id,
    name: action.payload.name,
    registrarUrl: registrarUrl,
    CA: CA,
    rootCa: CA?.rootCertString,
    peerList: [],
    registrar: null,
    onionAddress: '',
    privateKey: '',
    port: 0,
    registrationAttempts: 0,
    ownerCertificate: ''
  }

  yield* apply(socket, socket.emit, [SocketActionTypes.CREATE_NETWORK, payload])
}

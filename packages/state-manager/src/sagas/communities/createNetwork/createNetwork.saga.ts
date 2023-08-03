import { PayloadAction } from '@reduxjs/toolkit'
import { call, put } from 'typed-redux-saga'
import { Time } from 'pkijs'
import { generateId } from '../../../utils/cryptography/cryptography'
import { communitiesActions } from '../communities.slice'
import { createRootCA } from '@quiet/identity'
import { type Community, CommunityOwnership } from '@quiet/types'

export function* createNetworkSaga(
  action: PayloadAction<ReturnType<typeof communitiesActions.createNetwork>['payload']>
) {
  console.log('create network saga')
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

  // const registrarUrl = action.payload.registrar ? `http://${action.payload.registrar}.onion` : undefined

  const payload: Community = {
    id,
    name: action.payload.name,
    registrarUrl,
    CA,
    rootCa: CA?.rootCertString,
  }

  yield* put(communitiesActions.clearInvitationCode())
  yield* put(communitiesActions.addNewCommunity(payload))
  yield* put(communitiesActions.setCurrentCommunity(id))
}

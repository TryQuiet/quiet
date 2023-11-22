import { type PayloadAction } from '@reduxjs/toolkit'
import { put, call } from 'typed-redux-saga'
import { generateDmKeyPair } from '../../../utils/cryptography/cryptography'
import { identityActions } from '../../identity/identity.slice'
import { communitiesActions } from '../communities.slice'
import { type Identity, type ResponseCreateNetworkPayload } from '@quiet/types'

export function* responseCreateNetworkSaga(action: PayloadAction<ResponseCreateNetworkPayload>): Generator {
    const community = action.payload.community
    const network = action.payload.network

    const dmKeys = yield* call(generateDmKeyPair)

    const identity: Identity = {
        id: community.id,
        nickname: '',
        hiddenService: network.hiddenService,
        peerId: network.peerId,
        dmKeys,
        userCsr: null,
        userCertificate: null,
        joinTimestamp: null,
    }

    yield* put(communitiesActions.updateCommunityData(community))
    yield* put(identityActions.addNewIdentity(identity))
}

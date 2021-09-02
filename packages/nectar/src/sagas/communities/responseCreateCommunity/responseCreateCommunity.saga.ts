import { put } from "typed-redux-saga";
import { identityActions } from "../../identity/identity.slice";

export function* responseCreateCommunitySaga (action: any): Generator {

const id = action.payload.id
const hiddenService = action.payload.payload.hiddenService.onionAddress
const hiddenServicePrivateKey = action.payload.payload.hiddenService.privateKey
const peerId = action.payload.payload.peerId.id
const peerIdPrivateKey = action.payload.payload.peerId.privKey

yield* put(identityActions.addNewIdentity({
    id,
    hiddenService,
    hiddenServicePrivateKey,
    peerId,
    peerIdPrivateKey
}))
}
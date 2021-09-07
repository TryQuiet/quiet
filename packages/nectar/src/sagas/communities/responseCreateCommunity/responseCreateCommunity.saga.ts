import { put } from "typed-redux-saga";
import { identityActions } from "../../identity/identity.slice";

export function* responseCreateCommunitySaga (action: any): Generator {

const id = action.payload.id
const hiddenService = action.payload.payload.hiddenService

const peerId = action.payload.payload.peerId


yield* put(identityActions.addNewIdentity({
    id,
    hiddenService,
    peerId
}))
}
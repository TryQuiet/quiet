import { apply, select } from "typed-redux-saga";
import { SocketActionTypes } from "../../socket/const/actionTypes";
import { identitySelectors } from "../../identity/identity.selectors";
import { communitiesSelectors } from "../communities.selectors";

export function* launchRegistrarSaga(socket, _action): Generator {
    const identity = yield* select(identitySelectors.currentIdentity)
    const community = yield* select(communitiesSelectors.currentCommunity)
    yield* apply(socket, socket.emit, [SocketActionTypes.LAUNCH_REGISTRAR, identity.id ,identity.peerId.id, community.CA.rootCertString, community.CA.rootKeyString, community.privateKey])
}
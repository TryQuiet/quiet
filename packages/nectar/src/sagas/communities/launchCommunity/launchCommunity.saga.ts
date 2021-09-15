import { apply, select } from "typed-redux-saga";
import { SocketActionTypes } from "../../socket/const/actionTypes";
import { identitySelectors } from "../../identity/identity.selectors";

export function* launchCommunitySaga(socket,_action): Generator {
    const identity = yield* select(identitySelectors.currentIdentity)
    yield* apply(socket, socket.emit, [SocketActionTypes.LAUNCH_COMMUNITY, identity.id, identity.peerId, identity.hiddenService])
}

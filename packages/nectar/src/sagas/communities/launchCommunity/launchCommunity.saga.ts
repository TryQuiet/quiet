// import { put, apply, select } from "typed-redux-saga";
// import {communitiesActions} from '../communities.slice'
// import crypto from 'crypto'
// import { Socket } from "socket.io-client";
// import { SocketActionTypes } from "../../socket/const/actionTypes";
// import {communitiesSelectors } from '../communities.selectors'

// export function* launchCommunity(action, socket): Generator {

//     const id = action.payload
//     const selectedCommunity = yield* select(communitiesSelectors.selectById(id))

//     selectedCommunity.peerId

//     yield* apply(socket, socket.emit, [SocketActionTypes.LAUNCH_COMMUNITY, selectedCommunity.peerId, selectedCommunity.privateKey, []])
// }
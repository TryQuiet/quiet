import {createRootCA} from '@zbayapp/identity'
 // @ts-ignore
 import {Time} from 'pkijs'
import { call, apply, put } from 'typed-redux-saga'
import { communitiesActions } from '../communities.slice'
import { SocketActionTypes } from "../../socket/const/actionTypes";
import { generateId } from '../../../utils/cryptography/cryptography'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice';
import { PayloadAction } from '@reduxjs/toolkit';

export function* createCommunitySaga (socket, action: PayloadAction<string>): Generator {
const rootCa = yield* call(createRootCA, new Time({ type: 1, value: new Date() }), new Time({ type: 1, value: new Date(2030, 1, 1) }), action.payload )
const id = yield* call(generateId)
const payload = {id: id, CA: rootCa, name: action.payload, registrarUrl: '' }
yield* put(communitiesActions.addNewCommunity(payload))
yield* put(communitiesActions.setCurrentCommunity(id))
// yield* put(publicChannelsActions.addPublicChannelsList({id}))
yield* apply(socket, socket.emit, [SocketActionTypes.CREATE_COMMUNITY, {id, rootCertString: rootCa.rootCertString, rootCertKey: rootCa.rootKeyString}])
}
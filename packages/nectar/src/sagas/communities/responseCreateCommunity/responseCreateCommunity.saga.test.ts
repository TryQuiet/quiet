// import { combineReducers, EntityState } from '@reduxjs/toolkit';
// import { expectSaga } from 'redux-saga-test-plan';
// import { Socket } from 'socket.io-client';
// import { generateDmKeyPair } from '../../../utils/cryptography/cryptography';
// import { call } from 'redux-saga-test-plan/matchers';
// import { SocketActionTypes } from '../../socket/const/actionTypes';
// import { StoreKeys } from '../../store.keys';
// import {
//   communitiesActions,
//   communitiesReducer,
//   Community,
// } from '../communities.slice';
// import { responseCreateCommunitySaga } from './responseCreateCommunity.saga';
// import { communitiesAdapter } from '../communities.adapter';
// import {identityAdapter} from '../../identity/identity.adapter'
// import { identityReducer } from '../../identity/identity.slice';
// import {Identity} from '../../identity/identity.slice'

// describe('joinCommunity', () => {
//   test('join the existing community', async () => {
//     // const identity = new Identity({id: 'id', hiddenService:'HS', hiddenServicePrivateKey:'HSP', peerId:{id:'id'}, peerIdPrivateKey:'peerIdPK'})

//     const responseCreateCommunityPayload = {
//         id: 'id',
//       payload: {hiddenService: 'HS',
//     peerId: 'HSP'},
//     };
//     await expectSaga(responseCreateCommunitySaga, communitiesActions.responseCreateCommunity(responseCreateCommunityPayload))
//       .withReducer(
//         combineReducers({ [StoreKeys.Identity]: identityReducer }),
//         {
//           [StoreKeys.Identity]: identityAdapter.getInitialState()
//         }
//       )
//       .provide([
//           [call.fn(generateDmKeyPair), 'id'],
//           [call.fn(generateDmKeyPair), 'id']
//       ])
//       .hasFinalState(
//         {
//           [StoreKeys.Identity]: {
//               ids: ['id'],
//               entities: {
//                 'id': new Identity({id: 'id', hiddenService:'HS', hiddenServicePrivateKey:'HSP', peerId:{id:'id'}, peerIdPrivateKey:'peerIdPK'})
//           },
//         }}
//       )
//       .silentRun();
//   });
// });
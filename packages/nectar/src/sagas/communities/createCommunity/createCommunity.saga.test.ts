import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { Socket } from 'socket.io-client';
import { generateId } from '../../../utils/cryptography/cryptography';
import { call } from 'redux-saga-test-plan/matchers';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { StoreKeys } from '../../store.keys';
import {
  communitiesActions,
  communitiesReducer,
  Community,
  CommunitiesState,
} from '../communities.slice';
import { createCommunitySaga } from './createCommunity.saga';
import { createRootCA } from '@zbayapp/identity/lib';

describe('createCommunitySaga', () => {
  test('create new community', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket;
    const community: Community = {
      name: 'communityName',
      id: 'id',
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      registrarUrl: '',
      rootCa: '',
      peerList: [],
      registrar: null,
      onionAddress: '',
      privateKey: '',
      port: 0,
    };

    const id = 'id';

    await expectSaga(
      createCommunitySaga,
      socket,
      communitiesActions.createNewCommunity('communityName')
    )
      .withReducer(
        combineReducers({ [StoreKeys.Communities]: communitiesReducer }),
        {
          [StoreKeys.Communities]: { ...new CommunitiesState() },
        }
      )
      .provide([
        [call.fn(generateId), 'id'],
        [
          call.fn(createRootCA),
          { rootCertString: 'certString', rootKeyString: 'keyString' },
        ],
      ])
      .apply(socket, socket.emit, [SocketActionTypes.CREATE_NETWORK, id])
      .hasFinalState({
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: 'id',
          communities: {
            ids: ['id'],
            entities: {
              id: community,
            },
          },
        },
      })
      .run();
  });
});

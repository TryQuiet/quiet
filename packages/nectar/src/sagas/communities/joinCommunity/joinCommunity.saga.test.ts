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
import { communitiesAdapter } from '../communities.adapter';
import { joinCommunitySaga } from './joinCommunity.saga';

describe('joinCommunity', () => {
  test('join the existing community', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket;
    const community: Community = {
      id: 'id',
      name: '',
      registrarUrl: 'registrarUrl',
      CA: null,
      rootCa: '',
      peerList: [],
      registrar: null,
      onionAddress: '',
      privateKey: '',
      port: 0,
    };

    await expectSaga(
      joinCommunitySaga,
      socket,
      communitiesActions.joinCommunity('registrarUrl')
    )
      .withReducer(
        combineReducers({ [StoreKeys.Communities]: communitiesReducer }),
        {
          [StoreKeys.Communities]: { ...new CommunitiesState() },
        }
      )
      .provide([[call.fn(generateId), 'id']])
      .apply(socket, socket.emit, [
        SocketActionTypes.CREATE_NETWORK,
        community.id,
      ])
      .hasFinalState({
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: 'id',
          communities: communitiesAdapter.setAll(
            communitiesAdapter.getInitialState(),
            [community]
          ),
        },
      })
      .run();
  });
});

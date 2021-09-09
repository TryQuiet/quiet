import { combineReducers, EntityState } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { Socket } from 'socket.io-client';
import { generateId } from '../../../utils/cryptography/cryptography';
import { call } from 'redux-saga-test-plan/matchers';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { StoreKeys } from '../../store.keys';
import {
  communitiesActions,
  communitiesReducer,
  CommunitiesState,
  Community,
} from '../communities.slice';
import { joinCommunitySaga } from './joinCommunity.saga';
import { communitiesAdapter } from '../communities.adapter';

describe('joinCommunity', () => {
  test.skip('join existing community', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket;
    const community = new Community({
      name: '',
      id: 'id',
      registrarUrl: 'registrarUrl',
      CA: null,
    });

    const communityPayload = {
      id: 'id',
    };
    await expectSaga(
      joinCommunitySaga,
      socket,
      communitiesActions.joinCommunity('registrarUrl')
    )
      .withReducer(
        combineReducers({ [StoreKeys.Communities]: communitiesReducer }),
        {
          [StoreKeys.Communities]: new CommunitiesState(),
        }
      )
      .provide([[call.fn(generateId), 'id']])
      .apply(socket, socket.emit, [
        SocketActionTypes.CREATE_COMMUNITY,
        communityPayload,
      ])
      .hasFinalState({
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          communities: communitiesAdapter.setAll(
            communitiesAdapter.getInitialState(),
            [community]
          ),
        },
      })
      .silentRun();
  });
});

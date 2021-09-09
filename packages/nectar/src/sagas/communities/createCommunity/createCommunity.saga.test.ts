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
import { createCommunitySaga } from './createCommunity.saga';
import { createRootCA } from '@zbayapp/identity/lib';

describe('createCommunitySaga', () => {
  test.skip('create new community', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket;
    const community = new Community({
      name: 'communityName',
      id: 'id',
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      registrarUrl: '',
    });

    const communityPayload = {
      id: 'id',
      rootCertString: 'certString',
      rootCertKey: 'keyString',
    };
    await expectSaga(
      createCommunitySaga,
      socket,
      communitiesActions.createNewCommunity('communityName')
    )
      .withReducer(
        combineReducers({ [StoreKeys.Communities]: communitiesReducer }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
          },
        }
      )
      .provide([
        [call.fn(generateId), 'id'],
        [
          call.fn(createRootCA),
          { rootCertString: 'certString', rootKeyString: 'keyString' },
        ],
      ])
      .apply(socket, socket.emit, [
        SocketActionTypes.CREATE_COMMUNITY,
        communityPayload,
      ])
      .hasFinalState({
        [StoreKeys.Communities]: {
          ... new CommunitiesState(),
        },
      })
      .silentRun();
  });
});

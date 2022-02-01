import { PayloadAction } from '@reduxjs/toolkit';
import { Socket } from 'socket.io-client';
import { communitiesActions } from '../communities.slice';
export declare function launchRegistrarSaga(socket: Socket, action: PayloadAction<ReturnType<typeof communitiesActions.launchRegistrar>['payload']>): Generator;

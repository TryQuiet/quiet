import { PayloadAction } from '@reduxjs/toolkit';
import { Socket } from 'socket.io-client';
import { appActions } from './app.slice';
export declare function closeServicesSaga(socket: Socket, _action: PayloadAction<ReturnType<typeof appActions.closeServices>['payload']>): Generator;

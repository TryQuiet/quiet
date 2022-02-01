import { Socket } from 'socket.io-client';
import { PayloadAction } from '@reduxjs/toolkit';
import { socketActions } from './socket.slice';
export declare function startConnectionSaga(action: PayloadAction<ReturnType<typeof socketActions.startConnection>['payload']>): Generator;
export declare const connect: (dataPort: number) => Promise<Socket>;

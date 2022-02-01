import { publicChannelsActions } from '../publicChannels.slice';
import { PayloadAction } from '@reduxjs/toolkit';
import { Socket } from 'socket.io-client';
export declare function createChannelSaga(socket: Socket, action: PayloadAction<ReturnType<typeof publicChannelsActions.createChannel>['payload']>): Generator;

import { PayloadAction } from '@reduxjs/toolkit';
import { Socket } from 'socket.io-client';
import { publicChannelsActions } from '../publicChannels.slice';
export declare function askForMessagesSaga(socket: Socket, action: PayloadAction<ReturnType<typeof publicChannelsActions.askForMessages>['payload']>): Generator;

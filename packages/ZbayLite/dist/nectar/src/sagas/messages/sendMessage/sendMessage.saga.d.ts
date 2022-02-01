import { Socket } from 'socket.io-client';
import { PayloadAction } from '@reduxjs/toolkit';
import { messagesActions } from '../messages.slice';
export declare function sendMessageSaga(socket: Socket, action: PayloadAction<ReturnType<typeof messagesActions.sendMessage>['payload']>): Generator;

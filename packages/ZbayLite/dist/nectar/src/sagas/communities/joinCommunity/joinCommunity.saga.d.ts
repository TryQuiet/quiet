import { Socket } from 'socket.io-client';
import { PayloadAction } from '@reduxjs/toolkit';
export declare function joinCommunitySaga(socket: Socket, action: PayloadAction<string>): Generator;

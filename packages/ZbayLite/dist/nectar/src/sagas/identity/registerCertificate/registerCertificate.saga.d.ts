import { Socket } from 'socket.io-client';
import { PayloadAction } from '@reduxjs/toolkit';
import { identityActions } from '../identity.slice';
export declare function registerCertificateSaga(socket: Socket, action: PayloadAction<ReturnType<typeof identityActions.storeUserCsr>['payload']>): Generator;

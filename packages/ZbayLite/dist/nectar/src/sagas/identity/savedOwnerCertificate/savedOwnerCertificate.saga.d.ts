import { Socket } from 'socket.io-client';
import { PayloadAction } from '@reduxjs/toolkit';
import { identityActions } from '../identity.slice';
export declare function savedOwnerCertificateSaga(socket: Socket, action: PayloadAction<ReturnType<typeof identityActions.savedOwnerCertificate>['payload']>): Generator;

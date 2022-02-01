import { PayloadAction } from '@reduxjs/toolkit';
import { identityActions } from '../identity.slice';
export declare function createUserCsrSaga(action: PayloadAction<ReturnType<typeof identityActions.createUserCsr>['payload']>): Generator;

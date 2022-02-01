import { PayloadAction } from '@reduxjs/toolkit';
import { errorsActions } from '../errors.slice';
export declare function handleErrorsSaga(action: PayloadAction<ReturnType<typeof errorsActions.addError>['payload']>): Generator;

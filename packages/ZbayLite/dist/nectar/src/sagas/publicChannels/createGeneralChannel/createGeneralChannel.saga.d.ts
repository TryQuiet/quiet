import { PayloadAction } from '@reduxjs/toolkit';
import { publicChannelsActions } from '../publicChannels.slice';
export declare function createGeneralChannelSaga(action: PayloadAction<ReturnType<typeof publicChannelsActions.createGeneralChannel>['payload']>): Generator;

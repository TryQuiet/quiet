import { PayloadAction } from '@reduxjs/toolkit';
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice';
export declare function verifyMessagesSaga(action: PayloadAction<ReturnType<typeof publicChannelsActions.incomingMessages>>['payload']): Generator;

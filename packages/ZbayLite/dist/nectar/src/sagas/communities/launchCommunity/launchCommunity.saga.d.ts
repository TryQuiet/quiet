import { PayloadAction } from '@reduxjs/toolkit';
import { Socket } from 'socket.io-client';
import { communitiesActions } from '../communities.slice';
export declare function initCommunities(): Generator;
export declare function launchCommunitySaga(socket: Socket, action: PayloadAction<ReturnType<typeof communitiesActions.launchCommunity>['payload']>): Generator;

import { Socket } from 'socket.io-client';
import { ConnectedPeers } from '../../appConnection/connection.slice';
import { ResponseCreateCommunityPayload } from '../../communities/communities.types';
import { ErrorPayload } from '../../errors/errors.types';
import { ChannelMessagesIdsResponse, GetPublicChannelsResponse, IncomingMessages } from '../../publicChannels/publicChannels.types';
import { SendCertificatesResponse } from '../../users/users.types';
export declare function subscribe(socket: Socket): import("redux-saga").EventChannel<{
    payload: GetPublicChannelsResponse;
    type: string;
} | {
    payload: string;
    type: string;
} | {
    payload: ChannelMessagesIdsResponse;
    type: string;
} | {
    payload: IncomingMessages;
    type: string;
} | {
    payload: SendCertificatesResponse;
    type: string;
} | {
    payload: ResponseCreateCommunityPayload;
    type: string;
} | {
    payload: import("../../communities/communities.types").StorePeerListPayload;
    type: string;
} | {
    payload: import("../../..").StoreUserCertificatePayload;
    type: string;
} | {
    payload: ErrorPayload;
    type: string;
} | {
    payload: ConnectedPeers;
    type: string;
} | {
    payload: unknown;
    type: string;
}>;
export declare function handleActions(socket: Socket): Generator;
export declare function useIO(socket: Socket): Generator;

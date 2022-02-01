import SocketIO from 'socket.io';
import { PublicChannel } from '@zbayapp/nectar';
export declare const createdChannel: (socket: SocketIO.Server, channel: PublicChannel, communityId: string) => void;

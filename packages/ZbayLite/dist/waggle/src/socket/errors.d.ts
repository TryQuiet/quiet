import SocketIO from 'socket.io';
import { ErrorPayload, ErrorPayloadData } from '@zbayapp/nectar';
export declare const emitError: (io: SocketIO.Server, payload: ErrorPayload) => void;
export declare const emitValidationError: (io: SocketIO.Server, payload: ErrorPayloadData) => void;
export declare const emitServerError: (io: SocketIO.Server, payload: ErrorPayloadData) => void;

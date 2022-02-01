import { PayloadAction } from '@reduxjs/toolkit';
import { StoreKeys } from '@zbayapp/nectar';
export declare class SocketState {
    isConnected: boolean;
}
export interface WebsocketConnectionPayload {
    dataPort: number;
}
export declare const socketSlice: import("@reduxjs/toolkit").Slice<{
    isConnected: boolean;
}, {
    startConnection: (state: import("immer/dist/internal").WritableDraft<{
        isConnected: boolean;
    }>, _action: PayloadAction<WebsocketConnectionPayload>) => import("immer/dist/internal").WritableDraft<{
        isConnected: boolean;
    }>;
    closeConnection: (state: import("immer/dist/internal").WritableDraft<{
        isConnected: boolean;
    }>) => import("immer/dist/internal").WritableDraft<{
        isConnected: boolean;
    }>;
    setConnected: (state: import("immer/dist/internal").WritableDraft<{
        isConnected: boolean;
    }>) => void;
}, StoreKeys.Socket>;
export declare const socketActions: import("@reduxjs/toolkit").CaseReducerActions<{
    startConnection: (state: import("immer/dist/internal").WritableDraft<{
        isConnected: boolean;
    }>, _action: PayloadAction<WebsocketConnectionPayload>) => import("immer/dist/internal").WritableDraft<{
        isConnected: boolean;
    }>;
    closeConnection: (state: import("immer/dist/internal").WritableDraft<{
        isConnected: boolean;
    }>) => import("immer/dist/internal").WritableDraft<{
        isConnected: boolean;
    }>;
    setConnected: (state: import("immer/dist/internal").WritableDraft<{
        isConnected: boolean;
    }>) => void;
}>;
export declare const socketReducer: import("redux").Reducer<{
    isConnected: boolean;
}, import("redux").AnyAction>;

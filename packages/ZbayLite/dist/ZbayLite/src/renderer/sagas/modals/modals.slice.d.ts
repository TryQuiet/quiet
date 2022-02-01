import { PayloadAction } from '@reduxjs/toolkit';
import { CreateUsernameModalProps } from '../../containers/widgets/createUsernameModal/CreateUsername';
import { ModalName } from './modals.types';
export interface OpenModalPayload {
    name: ModalName;
    args?: CreateUsernameModalProps | {
        message?: string;
    };
}
export declare class ModalsInitialState {
    [ModalName.applicationUpdate]: {
        open: boolean;
    };
    [ModalName.createChannel]: {
        open: boolean;
    };
    [ModalName.accountSettingsModal]: {
        open: boolean;
    };
    [ModalName.openexternallink]: {
        open: boolean;
    };
    [ModalName.criticalError]: {
        open: boolean;
    };
    [ModalName.createUsernameModal]: {
        open: boolean;
        args: CreateUsernameModalProps;
    };
    [ModalName.channelInfo]: {
        open: boolean;
    };
    [ModalName.channelSettingsModal]: {
        open: boolean;
    };
    [ModalName.publishChannel]: {
        open: boolean;
    };
    [ModalName.joinChannel]: {
        open: boolean;
    };
    [ModalName.newMessageSeparate]: {
        open: boolean;
    };
    [ModalName.quitApp]: {
        open: boolean;
    };
    [ModalName.joinCommunityModal]: {
        open: boolean;
    };
    [ModalName.createCommunityModal]: {
        open: boolean;
    };
    [ModalName.sentryWarningModal]: {
        open: boolean;
    };
    [ModalName.loadingPanel]: {
        open: boolean;
        args: {
            message: string;
        };
    };
}
export declare const modalsSlice: import("@reduxjs/toolkit").Slice<{
    applicationUpdate: {
        open: boolean;
    };
    createChannel: {
        open: boolean;
    };
    accountSettingsModal: {
        open: boolean;
    };
    openexternallink: {
        open: boolean;
    };
    criticalError: {
        open: boolean;
    };
    createUsernameModal: {
        open: boolean;
        args: CreateUsernameModalProps;
    };
    channelInfo: {
        open: boolean;
    };
    channelSettingsModal: {
        open: boolean;
    };
    publishChannel: {
        open: boolean;
    };
    joinChannel: {
        open: boolean;
    };
    newMessageSeparate: {
        open: boolean;
    };
    quitApp: {
        open: boolean;
    };
    joinCommunityModal: {
        open: boolean;
    };
    createCommunityModal: {
        open: boolean;
    };
    sentryWarningModal: {
        open: boolean;
    };
    loadingPanel: {
        open: boolean;
        args: {
            message: string;
        };
    };
}, {
    openModal: (state: import("immer/dist/internal").WritableDraft<{
        applicationUpdate: {
            open: boolean;
        };
        createChannel: {
            open: boolean;
        };
        accountSettingsModal: {
            open: boolean;
        };
        openexternallink: {
            open: boolean;
        };
        criticalError: {
            open: boolean;
        };
        createUsernameModal: {
            open: boolean;
            args: CreateUsernameModalProps;
        };
        channelInfo: {
            open: boolean;
        };
        channelSettingsModal: {
            open: boolean;
        };
        publishChannel: {
            open: boolean;
        };
        joinChannel: {
            open: boolean;
        };
        newMessageSeparate: {
            open: boolean;
        };
        quitApp: {
            open: boolean;
        };
        joinCommunityModal: {
            open: boolean;
        };
        createCommunityModal: {
            open: boolean;
        };
        sentryWarningModal: {
            open: boolean;
        };
        loadingPanel: {
            open: boolean;
            args: {
                message: string;
            };
        };
    }>, action: PayloadAction<OpenModalPayload>) => void;
    closeModal: (state: import("immer/dist/internal").WritableDraft<{
        applicationUpdate: {
            open: boolean;
        };
        createChannel: {
            open: boolean;
        };
        accountSettingsModal: {
            open: boolean;
        };
        openexternallink: {
            open: boolean;
        };
        criticalError: {
            open: boolean;
        };
        createUsernameModal: {
            open: boolean;
            args: CreateUsernameModalProps;
        };
        channelInfo: {
            open: boolean;
        };
        channelSettingsModal: {
            open: boolean;
        };
        publishChannel: {
            open: boolean;
        };
        joinChannel: {
            open: boolean;
        };
        newMessageSeparate: {
            open: boolean;
        };
        quitApp: {
            open: boolean;
        };
        joinCommunityModal: {
            open: boolean;
        };
        createCommunityModal: {
            open: boolean;
        };
        sentryWarningModal: {
            open: boolean;
        };
        loadingPanel: {
            open: boolean;
            args: {
                message: string;
            };
        };
    }>, action: PayloadAction<ModalName>) => void;
}, "Modals">;
export declare const modalsActions: import("@reduxjs/toolkit").CaseReducerActions<{
    openModal: (state: import("immer/dist/internal").WritableDraft<{
        applicationUpdate: {
            open: boolean;
        };
        createChannel: {
            open: boolean;
        };
        accountSettingsModal: {
            open: boolean;
        };
        openexternallink: {
            open: boolean;
        };
        criticalError: {
            open: boolean;
        };
        createUsernameModal: {
            open: boolean;
            args: CreateUsernameModalProps;
        };
        channelInfo: {
            open: boolean;
        };
        channelSettingsModal: {
            open: boolean;
        };
        publishChannel: {
            open: boolean;
        };
        joinChannel: {
            open: boolean;
        };
        newMessageSeparate: {
            open: boolean;
        };
        quitApp: {
            open: boolean;
        };
        joinCommunityModal: {
            open: boolean;
        };
        createCommunityModal: {
            open: boolean;
        };
        sentryWarningModal: {
            open: boolean;
        };
        loadingPanel: {
            open: boolean;
            args: {
                message: string;
            };
        };
    }>, action: PayloadAction<OpenModalPayload>) => void;
    closeModal: (state: import("immer/dist/internal").WritableDraft<{
        applicationUpdate: {
            open: boolean;
        };
        createChannel: {
            open: boolean;
        };
        accountSettingsModal: {
            open: boolean;
        };
        openexternallink: {
            open: boolean;
        };
        criticalError: {
            open: boolean;
        };
        createUsernameModal: {
            open: boolean;
            args: CreateUsernameModalProps;
        };
        channelInfo: {
            open: boolean;
        };
        channelSettingsModal: {
            open: boolean;
        };
        publishChannel: {
            open: boolean;
        };
        joinChannel: {
            open: boolean;
        };
        newMessageSeparate: {
            open: boolean;
        };
        quitApp: {
            open: boolean;
        };
        joinCommunityModal: {
            open: boolean;
        };
        createCommunityModal: {
            open: boolean;
        };
        sentryWarningModal: {
            open: boolean;
        };
        loadingPanel: {
            open: boolean;
            args: {
                message: string;
            };
        };
    }>, action: PayloadAction<ModalName>) => void;
}>;
export declare const modalsReducer: import("redux").Reducer<{
    applicationUpdate: {
        open: boolean;
    };
    createChannel: {
        open: boolean;
    };
    accountSettingsModal: {
        open: boolean;
    };
    openexternallink: {
        open: boolean;
    };
    criticalError: {
        open: boolean;
    };
    createUsernameModal: {
        open: boolean;
        args: CreateUsernameModalProps;
    };
    channelInfo: {
        open: boolean;
    };
    channelSettingsModal: {
        open: boolean;
    };
    publishChannel: {
        open: boolean;
    };
    joinChannel: {
        open: boolean;
    };
    newMessageSeparate: {
        open: boolean;
    };
    quitApp: {
        open: boolean;
    };
    joinCommunityModal: {
        open: boolean;
    };
    createCommunityModal: {
        open: boolean;
    };
    sentryWarningModal: {
        open: boolean;
    };
    loadingPanel: {
        open: boolean;
        args: {
            message: string;
        };
    };
}, import("redux").AnyAction>;

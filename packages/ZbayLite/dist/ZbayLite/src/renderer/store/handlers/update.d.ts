export declare const checkForUpdate: () => (dispatch: any) => Promise<void>;
export declare const startApplicationUpdate: () => (dispatch: any) => Promise<void>;
export declare const declineUpdate: () => (dispatch: any) => Promise<void>;
export declare const epics: {
    checkForUpdate: () => (dispatch: any) => Promise<void>;
    startApplicationUpdate: () => (dispatch: any) => Promise<void>;
    declineUpdate: () => (dispatch: any) => Promise<void>;
};
declare const _default: {
    epics: {
        checkForUpdate: () => (dispatch: any) => Promise<void>;
        startApplicationUpdate: () => (dispatch: any) => Promise<void>;
        declineUpdate: () => (dispatch: any) => Promise<void>;
    };
};
export default _default;

export declare const generalErrors: ((state: {}) => import("./errors.types").ErrorPayload[]) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./errors.types").ErrorPayload>>) => import("./errors.types").ErrorPayload[] & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const currentCommunityErrors: ((state: {}) => import("./errors.types").ErrorPayload[]) & import("reselect").OutputSelectorFields<(args_0: string, args_1: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./errors.types").ErrorPayload>>) => import("./errors.types").ErrorPayload[] & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const currentCommunityErrorsByType: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("./errors.types").ErrorPayload>) & import("reselect").OutputSelectorFields<(args_0: string, args_1: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./errors.types").ErrorPayload>>) => import("@reduxjs/toolkit").Dictionary<import("./errors.types").ErrorPayload> & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const errorsSelectors: {
    currentCommunityErrors: ((state: {}) => import("./errors.types").ErrorPayload[]) & import("reselect").OutputSelectorFields<(args_0: string, args_1: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./errors.types").ErrorPayload>>) => import("./errors.types").ErrorPayload[] & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    currentCommunityErrorsByType: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("./errors.types").ErrorPayload>) & import("reselect").OutputSelectorFields<(args_0: string, args_1: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./errors.types").ErrorPayload>>) => import("@reduxjs/toolkit").Dictionary<import("./errors.types").ErrorPayload> & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    generalErrors: ((state: {}) => import("./errors.types").ErrorPayload[]) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./errors.types").ErrorPayload>>) => import("./errors.types").ErrorPayload[] & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
};

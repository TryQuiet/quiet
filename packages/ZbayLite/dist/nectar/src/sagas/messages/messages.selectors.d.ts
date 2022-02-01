export declare const publicKeysMapping: ((state: {}) => import("@reduxjs/toolkit").Dictionary<CryptoKey>) & import("reselect").OutputSelectorFields<(args_0: {
    publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
    messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./messages.types").MessageVerificationStatus>;
}) => import("@reduxjs/toolkit").Dictionary<CryptoKey> & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const messagesVerificationStatus: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("./messages.types").MessageVerificationStatus>) & import("reselect").OutputSelectorFields<(args_0: {
    publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
    messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./messages.types").MessageVerificationStatus>;
}) => import("@reduxjs/toolkit").Dictionary<import("./messages.types").MessageVerificationStatus> & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const messagesSelectors: {
    publicKeysMapping: ((state: {}) => import("@reduxjs/toolkit").Dictionary<CryptoKey>) & import("reselect").OutputSelectorFields<(args_0: {
        publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
        messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./messages.types").MessageVerificationStatus>;
    }) => import("@reduxjs/toolkit").Dictionary<CryptoKey> & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    messageVerificationStatusAdapter: import("@reduxjs/toolkit").EntityAdapter<import("./messages.types").MessageVerificationStatus>;
};

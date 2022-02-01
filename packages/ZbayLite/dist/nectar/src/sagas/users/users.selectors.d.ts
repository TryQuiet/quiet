/// <reference types="packages/waggle/node_modules/@types/pkijs" />
/// <reference types="packages/identity/node_modules/@types/pkijs" />
import { User } from './users.types';
export declare const certificates: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("pkijs/src/Certificate").default>) & import("reselect").OutputSelectorFields<(args_0: {
    certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
}) => import("@reduxjs/toolkit").Dictionary<import("pkijs/src/Certificate").default> & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const certificatesMapping: ((state: {}) => {
    [pubKey: string]: User;
}) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("pkijs/src/Certificate").default>) => {
    [pubKey: string]: User;
} & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const usersSelectors: {
    certificates: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("pkijs/src/Certificate").default>) & import("reselect").OutputSelectorFields<(args_0: {
        certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
    }) => import("@reduxjs/toolkit").Dictionary<import("pkijs/src/Certificate").default> & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    certificatesMapping: ((state: {}) => {
        [pubKey: string]: User;
    }) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("pkijs/src/Certificate").default>) => {
        [pubKey: string]: User;
    } & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
};

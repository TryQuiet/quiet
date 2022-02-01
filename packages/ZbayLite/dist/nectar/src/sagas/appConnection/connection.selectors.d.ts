export declare const initializedCommunities: ((state: {}) => {
    [key: string]: boolean;
}) & import("reselect").OutputSelectorFields<(args_0: {
    initializedCommunities: {
        [key: string]: boolean;
    };
    initializedRegistrars: {
        [key: string]: boolean;
    };
    connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
}) => {
    [key: string]: boolean;
} & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const initializedRegistrars: ((state: {}) => {
    [key: string]: boolean;
}) & import("reselect").OutputSelectorFields<(args_0: {
    initializedCommunities: {
        [key: string]: boolean;
    };
    initializedRegistrars: {
        [key: string]: boolean;
    };
    connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
}) => {
    [key: string]: boolean;
} & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const connectedPeers: ((state: {}) => string[]) & import("reselect").OutputSelectorFields<(args_0: {
    initializedCommunities: {
        [key: string]: boolean;
    };
    initializedRegistrars: {
        [key: string]: boolean;
    };
    connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
}) => string[] & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const connectedPeersMapping: ((state: {}) => {}) & import("reselect").OutputSelectorFields<(args_0: {
    [pubKey: string]: import("../..").User;
}, args_1: string[]) => {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const connectionSelectors: {
    initializedCommunities: ((state: {}) => {
        [key: string]: boolean;
    }) & import("reselect").OutputSelectorFields<(args_0: {
        initializedCommunities: {
            [key: string]: boolean;
        };
        initializedRegistrars: {
            [key: string]: boolean;
        };
        connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
    }) => {
        [key: string]: boolean;
    } & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    initializedRegistrars: ((state: {}) => {
        [key: string]: boolean;
    }) & import("reselect").OutputSelectorFields<(args_0: {
        initializedCommunities: {
            [key: string]: boolean;
        };
        initializedRegistrars: {
            [key: string]: boolean;
        };
        connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
    }) => {
        [key: string]: boolean;
    } & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    connectedPeers: ((state: {}) => string[]) & import("reselect").OutputSelectorFields<(args_0: {
        initializedCommunities: {
            [key: string]: boolean;
        };
        initializedRegistrars: {
            [key: string]: boolean;
        };
        connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
    }) => string[] & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    connectedPeersMapping: ((state: {}) => {}) & import("reselect").OutputSelectorFields<(args_0: {
        [pubKey: string]: import("../..").User;
    }, args_1: string[]) => {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
};

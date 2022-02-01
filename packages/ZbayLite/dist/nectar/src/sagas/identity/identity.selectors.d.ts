export declare const selectIdentities: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("./identity.types").Identity>) & import("reselect").OutputSelectorFields<(args_0: {
    identities: import("@reduxjs/toolkit").EntityState<import("./identity.types").Identity>;
}) => import("@reduxjs/toolkit").Dictionary<import("./identity.types").Identity> & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const selectById: (id: string) => ((state: {}) => import("./identity.types").Identity) & import("reselect").OutputSelectorFields<(args_0: {
    identities: import("@reduxjs/toolkit").EntityState<import("./identity.types").Identity>;
}) => import("./identity.types").Identity & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const selectEntities: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("./identity.types").Identity>) & import("reselect").OutputSelectorFields<(args_0: {
    identities: import("@reduxjs/toolkit").EntityState<import("./identity.types").Identity>;
}) => import("@reduxjs/toolkit").Dictionary<import("./identity.types").Identity> & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const currentIdentity: ((state: {}) => import("./identity.types").Identity) & import("reselect").OutputSelectorFields<(args_0: string, args_1: {
    identities: import("@reduxjs/toolkit").EntityState<import("./identity.types").Identity>;
}) => import("./identity.types").Identity & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const joinedCommunities: ((state: {}) => import("../..").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("../..").Community[], args_1: import("@reduxjs/toolkit").Dictionary<import("./identity.types").Identity>) => import("../..").Community[] & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const unregisteredCommunities: ((state: {}) => import("../..").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("../..").Community[], args_1: import("@reduxjs/toolkit").Dictionary<import("./identity.types").Identity>) => import("../..").Community[] & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const unregisteredCommunitiesWithoutUserIdentity: ((state: {}) => import("../..").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("../..").Community[], args_1: import("@reduxjs/toolkit").Dictionary<import("./identity.types").Identity>) => import("../..").Community[] & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const identitySelectors: {
    selectById: (id: string) => ((state: {}) => import("./identity.types").Identity) & import("reselect").OutputSelectorFields<(args_0: {
        identities: import("@reduxjs/toolkit").EntityState<import("./identity.types").Identity>;
    }) => import("./identity.types").Identity & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    selectEntities: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("./identity.types").Identity>) & import("reselect").OutputSelectorFields<(args_0: {
        identities: import("@reduxjs/toolkit").EntityState<import("./identity.types").Identity>;
    }) => import("@reduxjs/toolkit").Dictionary<import("./identity.types").Identity> & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    currentIdentity: ((state: {}) => import("./identity.types").Identity) & import("reselect").OutputSelectorFields<(args_0: string, args_1: {
        identities: import("@reduxjs/toolkit").EntityState<import("./identity.types").Identity>;
    }) => import("./identity.types").Identity & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    joinedCommunities: ((state: {}) => import("../..").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("../..").Community[], args_1: import("@reduxjs/toolkit").Dictionary<import("./identity.types").Identity>) => import("../..").Community[] & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    unregisteredCommunities: ((state: {}) => import("../..").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("../..").Community[], args_1: import("@reduxjs/toolkit").Dictionary<import("./identity.types").Identity>) => import("../..").Community[] & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    unregisteredCommunitiesWithoutUserIdentity: ((state: {}) => import("../..").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("../..").Community[], args_1: import("@reduxjs/toolkit").Dictionary<import("./identity.types").Identity>) => import("../..").Community[] & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
};

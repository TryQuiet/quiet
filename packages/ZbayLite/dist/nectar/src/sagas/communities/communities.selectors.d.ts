export declare const selectById: (id: string) => ((state: {}) => import("./communities.slice").Community) & import("reselect").OutputSelectorFields<(args_0: {
    currentCommunity: string;
    communities: import("@reduxjs/toolkit").EntityState<import("./communities.slice").Community>;
}) => import("./communities.slice").Community & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const selectEntities: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("./communities.slice").Community>) & import("reselect").OutputSelectorFields<(args_0: {
    currentCommunity: string;
    communities: import("@reduxjs/toolkit").EntityState<import("./communities.slice").Community>;
}) => import("@reduxjs/toolkit").Dictionary<import("./communities.slice").Community> & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const _allCommunities: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("./communities.slice").Community>) & import("reselect").OutputSelectorFields<(args_0: {
    currentCommunity: string;
    communities: import("@reduxjs/toolkit").EntityState<import("./communities.slice").Community>;
}) => import("@reduxjs/toolkit").Dictionary<import("./communities.slice").Community> & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const allCommunities: ((state: {}) => import("./communities.slice").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("./communities.slice").Community>) => import("./communities.slice").Community[] & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const ownCommunities: ((state: {}) => import("./communities.slice").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("./communities.slice").Community>) => import("./communities.slice").Community[] & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const currentCommunity: ((state: {}) => import("./communities.slice").Community) & import("reselect").OutputSelectorFields<(args_0: {
    currentCommunity: string;
    communities: import("@reduxjs/toolkit").EntityState<import("./communities.slice").Community>;
}) => import("./communities.slice").Community & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const communityById: (communityId: string) => ((state: {}) => import("./communities.slice").Community) & import("reselect").OutputSelectorFields<(args_0: {
    currentCommunity: string;
    communities: import("@reduxjs/toolkit").EntityState<import("./communities.slice").Community>;
}) => import("./communities.slice").Community & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const currentCommunityId: ((state: {}) => string) & import("reselect").OutputSelectorFields<(args_0: {
    currentCommunity: string;
    communities: import("@reduxjs/toolkit").EntityState<import("./communities.slice").Community>;
}) => string & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const registrarUrl: (communityId: string) => ((state: {}) => string) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("./communities.slice").Community>) => string & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const isOwner: ((state: {}) => boolean) & import("reselect").OutputSelectorFields<(args_0: import("./communities.slice").Community) => boolean & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const communitiesSelectors: {
    selectById: (id: string) => ((state: {}) => import("./communities.slice").Community) & import("reselect").OutputSelectorFields<(args_0: {
        currentCommunity: string;
        communities: import("@reduxjs/toolkit").EntityState<import("./communities.slice").Community>;
    }) => import("./communities.slice").Community & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    selectEntities: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("./communities.slice").Community>) & import("reselect").OutputSelectorFields<(args_0: {
        currentCommunity: string;
        communities: import("@reduxjs/toolkit").EntityState<import("./communities.slice").Community>;
    }) => import("@reduxjs/toolkit").Dictionary<import("./communities.slice").Community> & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    allCommunities: ((state: {}) => import("./communities.slice").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("./communities.slice").Community>) => import("./communities.slice").Community[] & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    ownCommunities: ((state: {}) => import("./communities.slice").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("./communities.slice").Community>) => import("./communities.slice").Community[] & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    currentCommunityId: ((state: {}) => string) & import("reselect").OutputSelectorFields<(args_0: {
        currentCommunity: string;
        communities: import("@reduxjs/toolkit").EntityState<import("./communities.slice").Community>;
    }) => string & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    currentCommunity: ((state: {}) => import("./communities.slice").Community) & import("reselect").OutputSelectorFields<(args_0: {
        currentCommunity: string;
        communities: import("@reduxjs/toolkit").EntityState<import("./communities.slice").Community>;
    }) => import("./communities.slice").Community & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    registrarUrl: (communityId: string) => ((state: {}) => string) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("./communities.slice").Community>) => string & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    isOwner: ((state: {}) => boolean) & import("reselect").OutputSelectorFields<(args_0: import("./communities.slice").Community) => boolean & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
};

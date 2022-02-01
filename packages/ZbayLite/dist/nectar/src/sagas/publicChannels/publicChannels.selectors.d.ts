import { CommunityChannels } from './publicChannels.slice';
import { DisplayableMessage } from '../..';
export declare const selectEntities: ((state: {}) => import("@reduxjs/toolkit").Dictionary<CommunityChannels>) & import("reselect").OutputSelectorFields<(args_0: {
    channels: import("@reduxjs/toolkit").EntityState<CommunityChannels>;
}) => import("@reduxjs/toolkit").Dictionary<CommunityChannels> & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const publicChannelsByCommunity: (id: string) => ((state: {}) => import("./publicChannels.types").PublicChannel[]) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<CommunityChannels>) => import("./publicChannels.types").PublicChannel[] & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const currentCommunityChannelsState: ((state: {}) => CommunityChannels) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<CommunityChannels>, args_1: string) => CommunityChannels & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const publicChannels: ((state: {}) => import("./publicChannels.types").PublicChannel[]) & import("reselect").OutputSelectorFields<(args_0: CommunityChannels) => import("./publicChannels.types").PublicChannel[] & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const publicChannelsMessages: ((state: {}) => import("./publicChannels.types").ChannelMessage[]) & import("reselect").OutputSelectorFields<(args_0: CommunityChannels) => import("./publicChannels.types").ChannelMessage[] & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const missingChannelsMessages: ((state: {}) => string[]) & import("reselect").OutputSelectorFields<(args_0: import("./publicChannels.types").ChannelMessage[]) => string[] & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const currentChannel: ((state: {}) => string) & import("reselect").OutputSelectorFields<(args_0: CommunityChannels) => string & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const channelLoadingSlice: ((state: {}) => number) & import("reselect").OutputSelectorFields<(args_0: CommunityChannels) => number & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const currentChannelMessages: ((state: {}) => import("./publicChannels.types").ChannelMessage[]) & import("reselect").OutputSelectorFields<(args_0: import("./publicChannels.types").ChannelMessage[], args_1: string) => import("./publicChannels.types").ChannelMessage[] & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const validCurrentChannelMessages: ((state: {}) => import("./publicChannels.types").ChannelMessage[]) & import("reselect").OutputSelectorFields<(args_0: import("./publicChannels.types").ChannelMessage[], args_1: {
    [pubKey: string]: import("../..").User;
}, args_2: import("@reduxjs/toolkit").Dictionary<import("../..").MessageVerificationStatus>) => import("./publicChannels.types").ChannelMessage[] & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const sortedCurrentChannelMessages: ((state: {}) => import("./publicChannels.types").ChannelMessage[]) & import("reselect").OutputSelectorFields<(args_0: import("./publicChannels.types").ChannelMessage[]) => import("./publicChannels.types").ChannelMessage[] & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const slicedCurrentChannelMessages: ((state: {}) => import("./publicChannels.types").ChannelMessage[]) & import("reselect").OutputSelectorFields<(args_0: import("./publicChannels.types").ChannelMessage[], args_1: number) => import("./publicChannels.types").ChannelMessage[] & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const currentChannelMessagesCount: ((state: {}) => number) & import("reselect").OutputSelectorFields<(args_0: import("./publicChannels.types").ChannelMessage[]) => number & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const dailyGroupedCurrentChannelMessages: ((state: {}) => {
    [date: string]: DisplayableMessage[];
}) & import("reselect").OutputSelectorFields<(args_0: DisplayableMessage[]) => {
    [date: string]: DisplayableMessage[];
} & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const currentChannelMessagesMergedBySender: ((state: {}) => {
    [day: string]: DisplayableMessage[][];
}) & import("reselect").OutputSelectorFields<(args_0: {
    [date: string]: DisplayableMessage[];
}) => {
    [day: string]: DisplayableMessage[][];
} & {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const publicChannelsSelectors: {
    publicChannelsByCommunity: (id: string) => ((state: {}) => import("./publicChannels.types").PublicChannel[]) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<CommunityChannels>) => import("./publicChannels.types").PublicChannel[] & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    publicChannels: ((state: {}) => import("./publicChannels.types").PublicChannel[]) & import("reselect").OutputSelectorFields<(args_0: CommunityChannels) => import("./publicChannels.types").PublicChannel[] & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    currentChannel: ((state: {}) => string) & import("reselect").OutputSelectorFields<(args_0: CommunityChannels) => string & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    currentChannelMessagesCount: ((state: {}) => number) & import("reselect").OutputSelectorFields<(args_0: import("./publicChannels.types").ChannelMessage[]) => number & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    dailyGroupedCurrentChannelMessages: ((state: {}) => {
        [date: string]: DisplayableMessage[];
    }) & import("reselect").OutputSelectorFields<(args_0: DisplayableMessage[]) => {
        [date: string]: DisplayableMessage[];
    } & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
    currentChannelMessagesMergedBySender: ((state: {}) => {
        [day: string]: DisplayableMessage[][];
    }) & import("reselect").OutputSelectorFields<(args_0: {
        [date: string]: DisplayableMessage[];
    }) => {
        [day: string]: DisplayableMessage[][];
    } & {
        clearCache: () => void;
    }> & {
        clearCache: () => void;
    };
};

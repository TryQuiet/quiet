/// <reference types="react" />
export declare const mapDispatchToProps: (dispatch: any) => {
    banUser: () => void;
    removeMessage: () => void;
};
export declare const ModeratorActionsPopper: ({ name, address, open, anchorEl, banUser }: {
    name: any;
    address: any;
    open: any;
    anchorEl: any;
    banUser: any;
}) => JSX.Element;
declare const _default: import("react-redux").ConnectedComponent<({ name, address, open, anchorEl, banUser }: {
    name: any;
    address: any;
    open: any;
    anchorEl: any;
    banUser: any;
}) => JSX.Element, import("react-redux").Omit<{
    name: any;
    address: any;
    open: any;
    anchorEl: any;
    banUser: any;
}, "banUser">>;
export default _default;

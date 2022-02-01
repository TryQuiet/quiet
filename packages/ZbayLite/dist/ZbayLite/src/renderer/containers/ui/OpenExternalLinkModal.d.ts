export interface useOpenExternalLinkModalActionsReturnTypes {
    addToWhitelist: (url: string) => void;
    setWhitelistAll: () => void;
}
export declare const useOpenExternalLinkModalActions: () => useOpenExternalLinkModalActionsReturnTypes;
declare const OpenLinkModal: ({ ...rest }: {
    [x: string]: any;
}) => JSX.Element;
export default OpenLinkModal;

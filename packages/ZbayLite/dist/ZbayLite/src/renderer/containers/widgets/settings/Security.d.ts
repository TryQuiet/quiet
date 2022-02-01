interface useSecurityDataReturnType {
    allowAll: boolean;
    whitelisted: any[];
    autoload: any[];
}
export declare const useSecurityData: () => useSecurityDataReturnType;
export declare const useSecurityActions: (allowAll: boolean) => {
    toggleAllowAll: () => void;
    removeImageHost: (hostname: string) => void;
    removeSiteHost: (hostname: string) => void;
};
export declare const Security: () => JSX.Element;
export default Security;

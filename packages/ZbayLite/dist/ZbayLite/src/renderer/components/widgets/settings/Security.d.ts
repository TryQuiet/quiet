import React from 'react';
interface SecurityProps {
    allowAll: boolean;
    toggleAllowAll: (arg: boolean) => void;
    openSeedModal: () => void;
    whitelisted: any[];
    removeSiteHost: (hostname: string) => void;
}
export declare const Security: React.FC<SecurityProps>;
export default Security;

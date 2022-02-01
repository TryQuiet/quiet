import React from 'react';
import { CommunityAction } from './community.keys';
export interface PerformCommunityActionProps {
    open: boolean;
    communityAction: CommunityAction;
    handleCommunityAction: (value: string) => void;
    handleRedirection: () => void;
    handleClose: () => void;
    isConnectionReady?: boolean;
    community: boolean;
}
export declare const PerformCommunityActionComponent: React.FC<PerformCommunityActionProps>;
export default PerformCommunityActionComponent;

import React from 'react';
interface LoadingPanelComponentProps {
    open: boolean;
    handleClose: () => void;
    isClosedDisabled?: boolean;
    message: string;
}
declare const LoadingPanelComponent: React.FC<LoadingPanelComponentProps>;
export default LoadingPanelComponent;

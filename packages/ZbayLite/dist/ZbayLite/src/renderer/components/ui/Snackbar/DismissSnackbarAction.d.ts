import React from 'react';
interface DismissSnackbarActionProps {
    notificationKey: string | number;
}
export declare const DismissSnackbarAction: React.FC<DismissSnackbarActionProps>;
export declare const notifierAction: (key: string | number) => JSX.Element;
export default DismissSnackbarAction;

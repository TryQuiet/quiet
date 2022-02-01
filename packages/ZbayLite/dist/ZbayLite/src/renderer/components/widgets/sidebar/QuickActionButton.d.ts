import React, { ReactElement } from 'react';
interface QuickActionButtonProps {
    text: string;
    action: () => void;
    icon?: ReactElement<any, any>;
}
export declare const QuickActionButton: React.FC<QuickActionButtonProps>;
export default QuickActionButton;

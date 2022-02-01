import React, { ReactElement } from 'react';
import Fab from '@material-ui/core/Fab';
interface ProgressFabProps {
    className?: string;
    children: ReactElement;
    loading?: boolean;
    success?: boolean;
    disabled?: boolean;
    onClick?: () => void;
}
export declare const ProgressFab: React.FC<React.ComponentProps<typeof Fab> & ProgressFabProps>;
export default ProgressFab;

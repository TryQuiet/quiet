import React from 'react';
import { ButtonProps } from '@material-ui/core/Button';
declare const useStyles: (props: {}) => import("@material-ui/styles").ClassNameMap<"button" | "progress" | "inProgress">;
interface LoadingButtonProps {
    inProgress?: boolean;
    text?: string;
    classes?: Partial<ReturnType<typeof useStyles>>;
}
export declare const LoadingButton: React.FC<ButtonProps & LoadingButtonProps>;
export default LoadingButton;

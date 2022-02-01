import React from 'react';
interface PasswordInputProps {
    error: boolean;
    label: string;
    password: string;
    passwordVisible: boolean;
    handleTogglePassword: () => void;
    handleSetPassword: () => void;
}
export declare const PasswordInput: React.FC<PasswordInputProps>;
export default PasswordInput;

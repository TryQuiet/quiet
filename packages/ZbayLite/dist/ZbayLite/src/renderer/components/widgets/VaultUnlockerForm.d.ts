import React from 'react';
interface VaultUnlockerFormProps {
    onSubmit: (arg: React.Dispatch<React.SetStateAction<boolean>>) => void;
    isNewUser: boolean;
}
export declare const VaultUnlockerForm: React.FC<VaultUnlockerFormProps>;
export default VaultUnlockerForm;

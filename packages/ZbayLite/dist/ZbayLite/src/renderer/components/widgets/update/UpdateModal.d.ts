import React from 'react';
interface UpdateModalProps {
    open: boolean;
    handleClose: () => void;
    handleUpdate: () => void;
}
export declare const UpdateModal: React.FC<UpdateModalProps>;
export default UpdateModal;

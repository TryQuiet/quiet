/// <reference types="react" />
import { IUser } from '../../../store/handlers/directMessages';
interface useSendMessagePopoverDataReturnType {
    users: any[];
    waggleUsers: {
        [key: string]: IUser;
    };
}
export declare const useSendMessagePopoverData: () => useSendMessagePopoverDataReturnType;
export declare const useSendMessagePopoverActions: () => {
    createNewContact: (contact: any) => void;
};
export declare const SendMessagePopover: ({ username, anchorEl, handleClose }: {
    username: any;
    anchorEl: any;
    handleClose: any;
}) => JSX.Element;
export default SendMessagePopover;

import { OpenModalPayload } from '../sagas/modals/modals.slice';
import { ModalName } from '../sagas/modals/modals.types';
export declare const useModal: <T extends import("./widgets/createUsernameModal/CreateUsername").CreateUsernameModalProps | {
    message?: string;
}>(name: ModalName) => {
    open: any;
    handleOpen: (args?: T) => {
        payload: OpenModalPayload;
        type: string;
    };
    handleClose: () => {
        payload: ModalName;
        type: string;
    };
} & T;

import { modalsActions, OpenModalPayload } from '../../../sagas/modals/modals.slice'
import { ModalName } from '../../../sagas/modals/modals.types'

export enum UserLabelType {
    DUPLICATE = 'Duplicate',
    UNREGISTERED = 'Unregistered',
}

export type HandleOpenModalType = (args?: object | undefined) => {
    payload: OpenModalPayload
    type: 'Modals/openModal'
}

export const payloadDuplicated = {
    payload: {
        name: ModalName.duplicatedUsernameModal,
    },
    type: modalsActions.openModal.type,
}

export const payloadUnregistered = {
    payload: {
        name: ModalName.duplicatedUsernameModal,
    },
    type: modalsActions.openModal.type,
}

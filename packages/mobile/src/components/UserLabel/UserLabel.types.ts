export enum UserLabelType {
    DUPLICATE = 'Duplicate',
    UNREGISTERED = 'Unregistered',
}

export interface UserLabelHandlers {
    duplicatedUsernameHandleBack: () => void
    unregisteredUsernameHandleBack: (username: string) => void
}

export interface UserLabelProps extends UserLabelHandlers {
    type: UserLabelType
    username: string
}

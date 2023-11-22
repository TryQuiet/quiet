import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { certificatesAdapter } from './users.adapter'
import { UsersState } from './users.slice'

export const UsersTransform = createTransform(
    (inboundState: UsersState, _key: any) => {
        return { ...inboundState }
    },
    (outboundState: UsersState, _key: any) => {
        if (outboundState.csrs == undefined) {
            outboundState.csrs = certificatesAdapter.getInitialState()
        }
        return {
            ...outboundState,
        }
    },
    { whitelist: [StoreKeys.Users] }
)

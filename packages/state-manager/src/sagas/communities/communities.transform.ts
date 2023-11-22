import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { type CommunitiesState } from './communities.slice'

export const CommunitiesTransform = createTransform(
    (inboundState: CommunitiesState, _key) => {
        return { ...inboundState }
    },
    (outboundState: CommunitiesState, _key) => {
        return {
            ...outboundState,
            invitationCode: undefined,
        }
    },
    { whitelist: [StoreKeys.Communities] }
)

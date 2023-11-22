import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { keyFromCertificate, parseCertificate, parseCertificationRequest } from '@quiet/identity'
import { StoreKeys } from '../store.keys'
import { certificatesAdapter } from './users.adapter'
import { SendCsrsResponse, type SendCertificatesResponse } from '@quiet/types'

export class UsersState {
    public certificates: EntityState<any> = certificatesAdapter.getInitialState()
    public csrs: EntityState<any> = certificatesAdapter.getInitialState()
}

export const usersSlice = createSlice({
    initialState: { ...new UsersState() },
    name: StoreKeys.Users,
    reducers: {
        // Utility action for testing purposes
        storeUserCertificate: (state, action: PayloadAction<{ certificate: string }>) => {
            certificatesAdapter.addOne(state.certificates, parseCertificate(action.payload.certificate))
        },
        responseSendCertificates: (state, _action: PayloadAction<SendCertificatesResponse>) => state,
        setAllCerts: (state, action: PayloadAction<SendCertificatesResponse>) => {
            certificatesAdapter.setAll(
                state.certificates,
                Object.values(action.payload.certificates).map(item => {
                    if (!item) {
                        return
                    }
                    return parseCertificate(item)
                })
            )
        },
        storeCsrs: (state, action: PayloadAction<SendCsrsResponse>) => {
            certificatesAdapter.upsertMany(
                state.csrs,
                Object.values(action.payload.csrs).map(item => {
                    if (!item) {
                        return
                    }
                    return parseCertificationRequest(item)
                })
            )
        },
        // Utility action for testing purposes
        test_remove_user_certificate: (state, action: PayloadAction<{ certificate: string }>) => {
            certificatesAdapter.removeOne(
                state.certificates,
                keyFromCertificate(parseCertificate(action.payload.certificate))
            )
        },
        test_remove_user_csr: (state, action: PayloadAction<{ csr: string }>) => {
            certificatesAdapter.removeOne(state.csrs, keyFromCertificate(parseCertificationRequest(action.payload.csr)))
        },
    },
})

export const usersActions = usersSlice.actions
export const usersReducer = usersSlice.reducer

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export class CertificatesState {
  usersCertificates: string[] = ['']
  ownCertificate = {
    certificate: '',
    privateKey: ''
  }
}

export const certificates = createSlice({
  initialState: { ...new CertificatesState() },
  name: 'Certificates',
  reducers: {
    setUsersCertificates: (state, action: PayloadAction<string[]>) => {
      state.usersCertificates = action.payload
    },
    setOwnCertificate: (state, action: PayloadAction<string>) => {
      state.ownCertificate.certificate = action.payload
    },
    setOwnCertKey: (state, action: PayloadAction<string>) => {
      state.ownCertificate.privateKey = action.payload
    },
    creactOwnCertificate: (state, _action: PayloadAction<string>) => {
      return state
    },
    saveCertificate: (state, _action: PayloadAction<string>) => {
      return state
    },
    responseGetCertificates: (state, _action: PayloadAction<{ certificates: string[] }>) => {
      return state
    }
  }
})

export const certificatesActions = certificates.actions
export const certificatesReducer = certificates.reducer

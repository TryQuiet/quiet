import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { HCaptchaRequest, type HCaptchaFormResponse } from '@quiet/types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('CaptchaSlice')

export class CaptchaState {
  public captchaRequested = false
  public siteKey: string = ''
}

export const captchaSlice = createSlice({
  initialState: { ...new CaptchaState() },
  name: StoreKeys.Captcha,
  reducers: {
    requestHCaptchaToken: (state, _action: PayloadAction<HCaptchaRequest>) => {
      state.captchaRequested = true
      state.siteKey = _action.payload.siteKey
    },
    setHcaptchaFormResponse: (state, _action: PayloadAction<HCaptchaFormResponse>) => {
      state.captchaRequested = false
    },
  },
})

export const captchaActions = captchaSlice.actions
export const captchaReducer = captchaSlice.reducer
